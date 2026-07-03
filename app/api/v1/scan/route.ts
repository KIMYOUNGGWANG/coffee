import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { parseScanRequest, type ScanImage } from "@/lib/guest-scan";
import { z } from "zod";

const scanRequestSchema = z.object({
  image: z.string().min(1),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
}).strict();

const scanResponseSchema = z.object({
  roasterName: z.string().nullish().transform(v => v || ""),
  beanName: z.string().nullish().transform(v => v || ""),
  origin: z.string().nullish().transform(v => v || ""),
  process: z.string().nullish().transform(v => v || ""),
  cupNotes: z.array(z.string()).nullish().transform(v => v || []),
  roastDate: z.string().nullish().transform(v => v || ""),
  roastLevel: z.string().nullish().transform(v => v || ""),
  weight: z.string().nullish().transform(v => v || ""),
  confidence: z.number().nullish().transform(v => v ?? 1.0),
});

export type ScanResult = z.infer<typeof scanResponseSchema>;

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: { code: status, message } }, { status });
}

function readScanImage(input: unknown): { image: ScanImage } | { response: NextResponse } {
  const request = scanRequestSchema.safeParse(input);
  if (!request.success) {
    return { response: jsonError(400, "JPEG, PNG 또는 WebP 이미지 데이터를 제공해주세요.") };
  }

  const dataUrl = request.data.image.startsWith("data:")
    ? request.data.image
    : `data:${request.data.mimeType};base64,${request.data.image}`;
  const parsedImage = parseScanRequest({ image: dataUrl });

  switch (parsedImage.kind) {
    case "ready":
      return { image: parsedImage.image };
    case "too_large":
      return { response: jsonError(413, "이미지는 5 MiB 이하여야 합니다.") };
    case "invalid":
      return { response: jsonError(400, "JPEG, PNG 또는 WebP base64 이미지 데이터를 제공해주세요.") };
  }
}

/**
 * POST /api/v1/scan
 *
 * Accepts a base64-encoded coffee-package image, sends it to Gemini Vision,
 * and returns structured metadata extracted from the label.
 *
 * Falls back to an empty template when no AI key is configured.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다." } },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const scanImage = readScanImage(body);
    if ("response" in scanImage) {
      return scanImage.response;
    }

    // Check limits via RPC before consuming expensive AI API
    const { data: scanCheck, error: rpcError } = await supabase
      .rpc('increment_user_scan', { target_user_id: user.id });

    if (rpcError) {
      return NextResponse.json(
        { error: { code: 500, message: "스캔 한도 확인 중 오류가 발생했습니다." } },
        { status: 500 },
      );
    }

    if (!scanCheck.allowed) {
      return NextResponse.json(
        { 
          error: { 
            code: 402, 
            message: "무료 스캔 횟수(월 3회)를 모두 사용했습니다. 무제한 스캔을 위해 Premium으로 업그레이드하세요.",
            details: scanCheck 
          } 
        },
        { status: 402 },
      );
    }

    // Resolve AI key
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey || apiKey === "your-gemini-or-openai-key" || apiKey.trim() === "") {
      // Return empty template so the user can fill manually
      return NextResponse.json({
        data: {
          roasterName: "",
          beanName: "",
          origin: "",
          process: "",
          cupNotes: [],
          roastDate: "",
          roastLevel: "",
          weight: "",
          confidence: 1.0,
        } satisfies ScanResult,
        warning: "AI API 키가 설정되지 않아 빈 템플릿을 반환합니다. 직접 입력해 주세요.",
      });
    }

    // Build prompt
    const prompt = `당신은 스페셜티 커피 원두 패키지의 라벨을 전문적으로 해독하는 AI 바리스타입니다.
첨부된 커피 원두 봉투/패키지 사진에서 다음 정보를 추출하여 정확히 JSON 포맷으로만 응답해 주세요.

## 추출 규칙
1. Roaster Name과 Bean Name을 명확히 구분하세요. 로스터리 이름(Roaster Name)은 보통 로고나 상/하단 브랜드명으로 있고, 원두 이름(Bean Name)은 가장 눈에 띄게 큰 글씨로 적혀 있습니다. 영문/국문이 혼용된 경우, 식별을 위해 가급적 병기하세요 (예: "Fritz (프릳츠)", "Dukes Coffee (듁스커피)").
2. 원두명은 농장, 지역, 품종, 등급 등이 섞여 있을 수 있습니다. 라벨에 적힌 그대로 추출하되 의미 단위로 깔끔하게 정리하세요.
3. Process(가공 방식)는 원문에 충실하되 영문(Washed, Natural, Anaerobic, Honey 등)과 국문(수세식, 자연건조, 무산소 발효 등)을 혼용하여 라벨에 적힌 대로 정확히 추출하세요.
4. 읽을 수 없거나 패키지에 없는 항목은 반드시 빈 문자열("") 또는 null로 남겨두세요. 절대 지어내지 마세요.
5. 설명이나 마크다운 코드블록(\`\`\`json) 없이 오직 순수한 JSON 객체 하나만 반환하세요.
6. confidence 항목은 로스터리명(roasterName)과 원두명(beanName) 등 핵심 정보 추출에 대한 확신도를 0.0에서 1.0 사이의 숫자로 평가하여 반환하세요. 사진이 흐리거나 식별이 매우 모호하면 0.8 미만으로 낮추세요.

## 기대하는 JSON 스키마
{
  "roasterName": "로스터리 이름 (영문/국문 혼용 시 병기)",
  "beanName": "원두 이름 (패키지에 적힌 원문 그대로, 예: Ethiopia Yirgacheffe G1)",
  "origin": "국가 또는 지역 (예: Ethiopia, Colombia)",
  "process": "가공 방식 (예: Washed, Natural, Honey, 무산소 발효)",
  "cupNotes": ["컵 노트 1", "컵 노트 2", "컵 노트 3"],
  "roastDate": "로스팅 날짜 (YYYY-MM-DD 형식)",
  "roastLevel": "로스팅 레벨 (Light, Medium, Medium-Dark, Dark 중 하나)",
  "weight": "용량 (예: 200g)",
  "confidence": 0.95
}`;

    // Call Gemini Vision
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: scanImage.image.mimeType,
                    data: scanImage.image.base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API 오류 (${geminiResponse.status}): ${errorText.slice(0, 200)}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "{}";

    // Parse & validate with zod (lenient – fills defaults for missing fields)
    let parsed: unknown;
    try {
      // Strip potential markdown code fences and extract JSON body safely
      const match = rawText.match(/\{[\s\S]*\}/);
      const cleaned = match ? match[0] : rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }

    const scanResultResult = scanResponseSchema.safeParse(parsed);
    const scanResult = scanResultResult.success ? scanResultResult.data : {
      roasterName: "",
      beanName: "",
      origin: "",
      process: "",
      cupNotes: [],
      roastDate: "",
      roastLevel: "",
      weight: "",
      confidence: 1.0,
    };

    return NextResponse.json({ data: scanResult });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: {
          code: 500,
          message: "스캔 처리 중 오류가 발생했습니다.",
          details: getErrorMessage(error),
        },
      },
      { status: 500 },
    );
  }
}
