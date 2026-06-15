import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { readStarterEnv } from "@/lib/env";
import { z } from "zod";

const generateSchema = z.object({
  tags: z.array(z.string()).default([]),
  rawNote: z.string().optional().default(""),
});

type GenerateInput = z.infer<typeof generateSchema>;

function generateFallbackTastingNote(tags: string[], rawNote: string): string {
  const normalizedTags = tags.map(t => t.toLowerCase());

  let acidityText = "균형 잡힌 산미";
  let sweetnessText = "부드러운 단맛";
  let finishText = "깔끔한 여운";

  if (normalizedTags.includes("citrus") || normalizedTags.includes("lemon") || normalizedTags.includes("orange")) {
    acidityText = "시트러스의 화사하고 산뜻한 산미";
  } else if (normalizedTags.includes("berry") || normalizedTags.includes("cherry") || normalizedTags.includes("grape")) {
    acidityText = "상큼한 베리류의 과일향과 산미";
  } else if (normalizedTags.includes("floral") || normalizedTags.includes("jasmine")) {
    acidityText = "꽃향기(Floral)의 화사한 아로마";
  }

  if (normalizedTags.includes("honey") || normalizedTags.includes("caramel") || normalizedTags.includes("sugar")) {
    sweetnessText = "꿀과 캐러멜의 진한 달콤함";
  } else if (normalizedTags.includes("chocolate") || normalizedTags.includes("cacao")) {
    sweetnessText = "밀크 초콜릿의 부드럽고 쌉싸름한 맛";
  } else if (normalizedTags.includes("nutty") || normalizedTags.includes("almond") || normalizedTags.includes("peanut")) {
    sweetnessText = "견과의 고소함과 은은한 단맛";
  }

  if (normalizedTags.includes("mint") || normalizedTags.includes("herb")) {
    finishText = "허브의 청량한 피니시";
  } else if (normalizedTags.includes("woody") || normalizedTags.includes("earthy")) {
    finishText = "묵직하고 깊은 잔향";
  }

  if (rawNote.trim().length > 0) {
    return `${acidityText}로 시작하여, ${sweetnessText}이 감돌며 "${rawNote}"와 같은 인상적인 향미로 마무리되는 컵.`;
  }

  return `${acidityText}로 시작하여, ${sweetnessText}을 지나 ${finishText}로 깔끔하게 마쳐지는 조화로운 컵.`;
}

// POST /api/v1/cards/ai-note - Generate SCA-style coffee tasting note
export async function POST(request: NextRequest) {
  let fallbackInput: GenerateInput = { tags: [], rawNote: "" };

  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = generateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "태그 및 노트를 확인해주세요.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const { tags, rawNote } = result.data;
    fallbackInput = { tags, rawNote };

    // Resolve environment variables
    let env;
    try {
      env = readStarterEnv(process.env);
    } catch {
      // Fallback if full environment validation is not complete
      env = { AI_API_KEY: process.env.AI_API_KEY };
    }

    const apiKey = env.AI_API_KEY;

    // Guard against placeholder or missing API key: return local fallback response
    if (!apiKey || apiKey === "your-gemini-or-openai-key" || apiKey.trim() === "") {
      const aiDescription = generateFallbackTastingNote(tags, rawNote);
      return NextResponse.json({ aiDescription });
    }

    const prompt = `Translate the following raw coffee tasting keywords: [${tags.join(", ")}] and personal notes: "${rawNote}" into a sophisticated, single-sentence tasting description (Max 120 characters). Follow the Specialty Coffee Association (SCA) flavor wheel vocabulary guidelines. Output ONLY the translated sentence in Korean. No conversational prefixes, quotes, or markdown.`;

    // Detect OpenAI vs Gemini key format
    if (apiKey.startsWith("sk-")) {
      // OpenAI Call
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      const aiDescription = data.choices[0]?.message?.content?.trim() || generateFallbackTastingNote(tags, rawNote);
      return NextResponse.json({ aiDescription });
    } else {
      // Gemini Beta Call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const aiDescription = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || generateFallbackTastingNote(tags, rawNote);
      return NextResponse.json({ aiDescription });
    }
  } catch (error: unknown) {
    // Graceful fallback to avoid breaking the UI workflow even on network/API keys issues
    const fallbackNote = generateFallbackTastingNote(fallbackInput.tags, fallbackInput.rawNote);
    return NextResponse.json({
      aiDescription: fallbackNote,
      warning: "AI API 호출 실패로 내장 감성 로직으로 생성된 노트입니다.",
      details: getErrorMessage(error)
    });
  }
}
