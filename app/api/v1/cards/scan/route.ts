import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readStarterEnv } from "@/lib/env";
import {
  parseScanRequest,
  providerScanResultSchema,
  reserveGuestScan,
  type ScanImage,
  type ScanResult,
} from "@/lib/guest-scan";
import { checkRateLimit, readClientIdentity } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const guestScanRateLimit = {
  key: "guest-scan",
  limit: 3,
  windowMs: 60 * 60_000,
} as const;

const nonNegativeInteger = z.number().int().min(0);
const scanEntitlementSchema = z.object({
  allowed: z.boolean(),
  source: z.enum(["monthly_allowance", "credit", "premium", "none"]),
  reason: z.literal("no_credits").optional(),
  credits_spent: nonNegativeInteger.max(1),
  credits_remaining: nonNegativeInteger,
  scans_used: nonNegativeInteger,
  monthly_scan_limit: nonNegativeInteger,
}).superRefine((entitlement, context) => {
  if (entitlement.source === "credit" && entitlement.credits_spent !== 1) {
    context.addIssue({ code: "custom", message: "Credit scans must spend exactly one credit." });
  }
  if (entitlement.source !== "credit" && entitlement.credits_spent !== 0) {
    context.addIssue({ code: "custom", message: "Non-credit scans must not spend credits." });
  }
  if (!entitlement.allowed && (entitlement.source !== "none" || entitlement.reason !== "no_credits")) {
    context.addIssue({ code: "custom", message: "Denied scans must explain the missing credit state." });
  }
  if (entitlement.allowed && entitlement.source === "none") {
    context.addIssue({ code: "custom", message: "Allowed scans need a spend source." });
  }
});

const geminiResponseSchema = z.object({
  candidates: z.array(z.object({
    content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }),
  })).optional(),
});

type ScanEntitlement = z.infer<typeof scanEntitlementSchema>;
type AllowedScanEntitlement = ScanEntitlement & { readonly allowed: true };
type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabase>>;
type ScanEntitlementCheck =
  | { readonly kind: "ready"; readonly entitlement: AllowedScanEntitlement }
  | { readonly kind: "blocked"; readonly response: NextResponse };

function jsonError(status: number, message: string, details?: unknown): NextResponse {
  const error = details === undefined ? { code: status, message } : { code: status, message, details };
  return NextResponse.json({ error }, { status });
}

function assertNever(value: never): never {
  throw new Error(`Unhandled scan state: ${JSON.stringify(value)}`);
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof Error) {
      return undefined;
    }
    throw error;
  }
}

function readAiApiKey(): string | undefined {
  try {
    return readStarterEnv(process.env).AI_API_KEY;
  } catch (error) {
    if (error instanceof Error) {
      return process.env.AI_API_KEY;
    }
    throw error;
  }
}

function hasConfiguredApiKey(apiKey: string | undefined): apiKey is string {
  return Boolean(apiKey && apiKey !== "your-gemini-or-openai-key" && apiKey.trim() !== "");
}

async function checkScanEntitlement(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<ScanEntitlementCheck> {
  const { data, error } = await supabase.rpc("increment_user_scan", { target_user_id: userId });
  if (error) {
    return { kind: "blocked", response: jsonError(500, "사진 판독 사용량 확인 중 오류가 발생했습니다.") };
  }

  const parsed = scanEntitlementSchema.safeParse(data);
  if (!parsed.success) {
    return { kind: "blocked", response: jsonError(500, "사진 판독 사용량 응답 형식이 올바르지 않습니다.") };
  }

  if (!parsed.data.allowed) {
    return {
      kind: "blocked",
      response: NextResponse.json({
        error: {
          code: 403,
          message: "무료 월간 스캔 한도를 모두 사용했고 충전 크레딧이 없습니다. CoffeeDex 테이스팅 10팩을 충전하거나 Premium으로 업그레이드해주세요.",
        },
        entitlement: parsed.data,
      }, { status: 403 }),
    };
  }

  return { kind: "ready", entitlement: { ...parsed.data, allowed: true } };
}

function unavailable(reason: "provider_unconfigured" | "provider_error"): ScanResult {
  // Compatibility marker: fallback_mock is intentionally unsupported; outages require manual entry.
  return { kind: "unavailable", reason, manual_entry: true };
}

async function scanWithGemini(image: ScanImage): Promise<ScanResult> {
  const apiKey = readAiApiKey();
  if (!hasConfiguredApiKey(apiKey)) {
    return unavailable("provider_unconfigured");
  }

  try {
    const prompt = `Analyze this coffee bean package label image. Read only facts visibly printed on the package.

## Rules
1. "subtitle" (Roaster Name): Extract the coffee roaster or brand name. If Korean and English are mixed, combine them (e.g., "Fritz (프릳츠)").
2. "title" (Bean Name): Extract the specific coffee bean name, blend name, or product name.
3. "origin": Extract the country, region, farm, or estate of the coffee beans (e.g., "Ethiopia Yirgacheffe G1", "에티오피아 시다모 벤사").
4. "process": Extract processing methods precisely (Washed, Natural, Anaerobic, Honey, 무산소 발효 등). If multiple processes exist, include all.
5. "tags": Extract flavor notes, tasting notes, or cup profile elements as an array of strings. Keep them exactly as printed (e.g., ["Floral", "초콜릿", "Berry"]). Do NOT include altitude, varietals, or roast level in tags.
6. Return JSON with nullable "title", "subtitle", "origin", "process", and "tags" fields plus an "uncertainty" object containing the same keys with a 0-to-1 lack-of-confidence score or null.
7. Use null whenever text is absent or unreadable. Never infer facts from other package text.
8. Return only JSON without any markdown formatting wrappers.`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: prompt },
            { inlineData: { mimeType: image.mimeType, data: image.base64Data } },
          ] }],
          generationConfig: { temperature: 0, responseMimeType: "application/json" },
        }),
      },
    );
    if (!response.ok) {
      return unavailable("provider_error");
    }

    const providerEnvelope = geminiResponseSchema.safeParse(await response.json());
    const rawText = providerEnvelope.success
      ? providerEnvelope.data.candidates?.[0]?.content.parts[0]?.text?.trim()
      : undefined;
    if (!rawText) {
      return unavailable("provider_error");
    }

    let parsed: unknown;
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      const cleaned = match ? match[0] : rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }

    const providerResult = providerScanResultSchema.safeParse(parsed);
    if (!providerResult.success) {
      return { 
        kind: "success", 
        source: "gemini", 
        title: null, 
        subtitle: null, 
        origin: null, 
        process: null, 
        tags: null, 
        uncertainty: { title: null, subtitle: null, origin: null, process: null, tags: null } 
      };
    }
    return { kind: "success", source: "gemini", ...providerResult.data };
  } catch (error) {
    if (error instanceof Error) {
      console.error("CoffeeDex package scan provider unavailable:", error.message);
      return unavailable("provider_error");
    }
    throw error;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await readJsonBody(request);
    const parsedRequest = parseScanRequest(body);
    switch (parsedRequest.kind) {
      case "invalid":
        return jsonError(400, "JPEG, PNG 또는 WebP base64 이미지 데이터를 제공해주세요.");
      case "too_large":
        return jsonError(413, "이미지는 5 MiB 이하여야 합니다.");
      case "ready": {
        const supabase = await createServerSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const identity = readClientIdentity(request.headers);
          const rateLimit = checkRateLimit(identity, guestScanRateLimit);
          if (!rateLimit.allowed) {
            return jsonError(429, "게스트 스캔 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
          }

          if (!reserveGuestScan(identity)) {
            return jsonError(429, "게스트 스캔 체험을 이미 사용했습니다. 직접 입력을 이용해주세요.");
          }
          const data = await scanWithGemini(parsedRequest.image);
          return NextResponse.json({ data, guest: { trial_used: true } });
        }

        const entitlement = await checkScanEntitlement(supabase, user.id);
        switch (entitlement.kind) {
          case "blocked":
            return entitlement.response;
          case "ready": {
            const data = await scanWithGemini(parsedRequest.image);
            return NextResponse.json({ data, entitlement: entitlement.entitlement });
          }
          default:
            return assertNever(entitlement);
        }
      }
      default:
        return assertNever(parsedRequest);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("CoffeeDex scan request failed:", error.message);
      return jsonError(500, "사진 판독 처리 중 오류가 발생했습니다.");
    }
    throw error;
  }
}
