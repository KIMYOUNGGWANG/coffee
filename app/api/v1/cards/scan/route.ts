import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { readStarterEnv } from "@/lib/env";
import { z } from "zod";

const scanSchema = z.object({ image: z.string().min(1, "이미지 데이터가 필요합니다.") });

const scanResultSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  origin: z.string(),
  process: z.string(),
  tags: z.array(z.string()),
  metric1_acidity: z.number(),
  metric2_sweetness: z.number(),
  metric3_body: z.number(),
  confidence: z.number().min(0).max(1).default(0.74),
  source: z.enum(["gemini_vision", "fallback_mock"]).default("gemini_vision"),
});

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

type ScanResult = z.infer<typeof scanResultSchema>;
type ScanEntitlement = z.infer<typeof scanEntitlementSchema>;
type AllowedScanEntitlement = ScanEntitlement & { readonly allowed: true };
type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabase>>;

type ScanEntitlementCheck =
  | { readonly kind: "ready"; readonly entitlement: AllowedScanEntitlement }
  | { readonly kind: "blocked"; readonly response: NextResponse };

const defaultMockScanResult: ScanResult = {
  title: "Ethiopia Yirgacheffe Aricha Natural",
  subtitle: "모모스 커피 (Momos Coffee)",
  origin: "Ethiopia",
  process: "Natural",
  tags: ["Peach", "Jasmine", "Honey", "Citrus"],
  metric1_acidity: 4,
  metric2_sweetness: 4,
  metric3_body: 2,
  confidence: 0.62,
  source: "fallback_mock",
};

const mockOptions: readonly ScanResult[] = [
  defaultMockScanResult,
  { title: "Colombia Huila Monteblanco Purple Caturra", subtitle: "프릳츠 커피 (Fritz Coffee)", origin: "Colombia", process: "Anaerobic", tags: ["Berry", "Chocolate", "Caramel", "Apple"], metric1_acidity: 3, metric2_sweetness: 5, metric3_body: 4, confidence: 0.58, source: "fallback_mock" },
  { title: "Kenya Nyeri Ichamama Washed", subtitle: "블루보틀 커피 (Blue Bottle)", origin: "Kenya", process: "Washed", tags: ["Citrus", "Lemon", "Orange", "Earthy"], metric1_acidity: 5, metric2_sweetness: 3, metric3_body: 3, confidence: 0.6, source: "fallback_mock" },
];

const fallbackScanWarning = "AI 키 미설정 또는 호출 실패로 내장 샘플 분석 초안을 반환했습니다. 저장 전 꼭 확인하고 수정해주세요.";

function generateMockScanResult(): ScanResult {
  return mockOptions[Math.floor(Math.random() * mockOptions.length)] ?? defaultMockScanResult;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류";
}

function jsonError(status: number, message: string, details?: unknown) {
  const error = details === undefined
    ? { code: status, message }
    : { code: status, message, details };
  return NextResponse.json({ error }, { status });
}

function assertNever(value: never): never {
  throw new Error(`Unhandled scan entitlement state: ${JSON.stringify(value)}`);
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof Error) {
      return {};
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

function hasConfiguredApiKey(apiKey: string | undefined): boolean {
  return Boolean(apiKey && apiKey !== "your-gemini-or-openai-key" && apiKey.trim() !== "");
}

function parseImagePayload(image: string) {
  const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
  return { mimeType: base64Match?.[1] ?? "image/jpeg", base64Data: base64Match?.[2] ?? image };
}

async function checkScanEntitlement(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<ScanEntitlementCheck> {
  const { data, error } = await supabase
    .rpc("increment_user_scan", { target_user_id: userId });

  if (error) {
    return {
      kind: "blocked",
      response: jsonError(
        500,
        "AI 스캔 사용량 확인 중 오류가 발생했습니다.",
        error.message,
      ),
    };
  }

  const parsedEntitlement = scanEntitlementSchema.safeParse(data);
  if (!parsedEntitlement.success) {
    return {
      kind: "blocked",
      response: jsonError(
        500,
        "AI 스캔 사용량 응답 형식이 올바르지 않습니다.",
        parsedEntitlement.error.format(),
      ),
    };
  }

  if (!parsedEntitlement.data.allowed) {
    return {
      kind: "blocked",
      response: NextResponse.json(
        {
          error: {
            code: 403,
            message:
              "무료 월간 스캔 한도를 모두 사용했고 충전 크레딧이 없습니다. Hyangmi 테이스팅 10팩을 충전하거나 Premium으로 업그레이드해주세요.",
          },
          entitlement: parsedEntitlement.data,
        },
        { status: 403 },
      ),
    };
  }

  return { kind: "ready", entitlement: { ...parsedEntitlement.data, allowed: true } };
}

function scanJson(data: ScanResult, entitlement: AllowedScanEntitlement, warning?: string) {
  return NextResponse.json(warning ? { data, entitlement, warning } : { data, entitlement });
}

async function scanWithGemini(image: string, entitlement: AllowedScanEntitlement) {
  try {
    const { mimeType, base64Data } = parseImagePayload(image);
    const apiKey = readAiApiKey();

    if (!hasConfiguredApiKey(apiKey)) {
      return scanJson(generateMockScanResult(), entitlement, fallbackScanWarning);
    }

    const prompt = `Analyze this coffee bean package label image and extract the details as a JSON object. Ensure the keys are EXACTLY: "title" (coffee bean name, e.g. Ethiopia Yirgacheffe Aricha Natural), "subtitle" (brand/roaster name, e.g. Momos Coffee), "origin" (country of origin), "process" (processing method), "tags" (array of tasting/flavor notes), "metric1_acidity" (1 to 5), "metric2_sweetness" (1 to 5), "metric3_body" (1 to 5), and "confidence" (0 to 1). If fields are not visible, make educated estimates based on the bean type, processing, or origin. Return ONLY the JSON object. Do not include markdown code block symbols (like \`\`\`json).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Vision API returned status ${response.status}`);
    }

    const responseJson: unknown = await response.json();
    const geminiResponse = geminiResponseSchema.safeParse(responseJson);
    const textOutput = geminiResponse.success
      ? geminiResponse.data.candidates?.[0]?.content.parts[0]?.text?.trim()
      : undefined;

    if (!textOutput) {
      throw new Error("Empty response from Gemini Vision API");
    }

    const parsedJson: unknown = JSON.parse(textOutput);
    return scanJson({ ...scanResultSchema.parse(parsedJson), source: "gemini_vision" }, entitlement);
  } catch (error) {
    console.error("AI Scan processing failed:", error);
    return NextResponse.json({
      data: generateMockScanResult(),
      entitlement,
      warning: fallbackScanWarning,
      details: getErrorMessage(error),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonError(401, "로그인이 필요합니다.");
    }

    // Validate request body
    const body = await readJsonBody(request);
    const result = scanSchema.safeParse(body);
    if (!result.success) {
      return jsonError(400, "올바른 이미지 데이터를 제공해주세요.", result.error.format());
    }

    const scanEntitlement = await checkScanEntitlement(supabase, user.id);
    switch (scanEntitlement.kind) {
      case "blocked":
        return scanEntitlement.response;
      case "ready":
        return await scanWithGemini(result.data.image, scanEntitlement.entitlement);
      default:
        assertNever(scanEntitlement);
    }
  } catch (error) {
    console.error("AI Scan request failed:", error);
    return jsonError(500, "AI 스캔 처리 중 오류가 발생했습니다.", getErrorMessage(error));
  }
}
