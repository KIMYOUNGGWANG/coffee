import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { readStarterEnv } from "@/lib/env";
import { z } from "zod";

const aiBaristaRequestSchema = z.object({
  situation: z.string().optional().default("아침 깨어남"), // "아침 깨어남", "오후 나른함", "비 오는 날", "디저트와 함께" 등
});

interface ShelfItem {
  id: string;
  roaster_name: string;
  bean_name: string;
  origin: string | null;
  roast_date: string | null;
  opened_date: string | null;
  fill_level: number;
}

// Helper to generate a detailed local fallback recommendation if AI API keys are unavailable
function generateLocalRecommendation(shelfItems: ShelfItem[], situation: string): string {
  if (shelfItems.length === 0) {
    return "현재 원두 선반이 비어 있습니다. 향미 원두 보관함에 맛있는 원두를 등록하고, 오늘 상황에 맞는 커스텀 AI 브루잉 가이드를 받아보세요! 먼저 마켓이나 로스터리에서 구한 원두를 선반에 올려두는 것부터 시작해보세요.";
  }

  // Pick the first item to generate recommendation
  const primaryItem = shelfItems[0];
  const beanTitle = `[${primaryItem.roaster_name}] ${primaryItem.bean_name}`;
  
  let recommendationText = "";
  
  if (situation.includes("아침") || situation.includes("깨어남")) {
    recommendationText = `상쾌한 아침을 위해 선반의 **${beanTitle}** 원두를 추천합니다. \n\n**추천 레시피 (하리오 V60 드립):**\n- **원두량:** 20g (약간 굵은 분쇄)\n- **추출수 온도:** 92°C\n- **추출량:** 총 300g (뜸 들이기 40g / 40초 -> 1차 120g -> 2차 80g -> 3차 60g 푸어)\n\n**바리스타 코멘트:** 아침의 미각을 깨우기 위해 너무 강하지 않은 산미와 부드러운 단맛 위주의 깔끔한 푸어오버(Pour-over) 방식으로 컵을 완성해 보세요.`;
  } else if (situation.includes("오후") || situation.includes("나른함")) {
    recommendationText = `나른한 오후의 리프레시를 위해 **${beanTitle}** 원두로 진한 브루잉을 제안합니다. \n\n**추천 레시피 (아이스 브루잉):**\n- **원두량:** 22g (보통 분쇄)\n- **추출수 온도:** 94°C\n- **추출량:** 서버에 얼음을 120g 채우고, 뜨거운 물 180g으로 진하게 추출하여 급랭\n\n**바리스타 코멘트:** 오후의 피로를 풀어줄 커피입니다. 얼음 위에 바로 떨어뜨려 에스테르 향미 성분을 가두어 차갑고 화사한 컵을 연출해 보세요.`;
  } else if (situation.includes("비") || situation.includes("우울")) {
    recommendationText = `비 오는 차분한 날에는 **${beanTitle}**의 묵직한 바디감이 잘 어울립니다. \n\n**추천 레시피 (에어로프레스 또는 진한 드립):**\n- **원두량:** 18g (보통보다 약간 고운 분쇄)\n- **추출수 온도:** 89°C (온도를 낮춰 쓴맛 억제)\n- **추출량:** 총 240g 기포를 내며 차분하게 침출\n\n**바리스타 코멘트:** 비 오는 날에는 뜸을 길게 들이며(50초) 원두 내부의 가스를 차분히 빼주고 온도를 낮추어 부드러운 초콜릿 같은 질감과 묵직한 단맛을 유도하는 브루잉이 감성을 더해줍니다.`;
  } else {
    // Default
    recommendationText = `오늘 기분에 맞추어 선반의 **${beanTitle}** 원두 추출을 제안합니다. \n\n**추천 레시피:**\n- **원두량:** 20g\n- **추출수 온도:** 91°C\n- **추출량:** 원두 무게의 15배인 물 300g 추출\n\n**바리스타 코멘트:** 남은 잔량(${primaryItem.fill_level}%)의 컨디션을 고려했을 때, 산미와 단맛의 밸런스를 가장 잘 느낄 수 있는 표준 비율 추출법입니다. 컵이 식어가면서 변하는 다채로운 향미를 천천히 음미해 보세요.`;
  }

  // If there are multiple items, suggest a blend option
  if (shelfItems.length >= 2) {
    const secondaryItem = shelfItems[1];
    recommendationText += `\n\n💡 **스페셜 블렌딩 팁:** 보유 중이신 **${primaryItem.bean_name}**과 **${secondaryItem.bean_name}** 원두를 6:4 비율로 섞어 브루잉해 보세요. 새로운 복합적 아로마와 긴 여운을 만나보실 수 있습니다.`;
  }

  return recommendationText;
}

// POST /api/v1/ai-barista - AI Barista Recommendation Engine
export async function POST(request: NextRequest) {
  let situation = "아침 깨어남";
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

    // Parse parameters
    try {
      const body = await request.json();
      const result = aiBaristaRequestSchema.safeParse(body);
      if (result.success) {
        situation = result.data.situation;
      }
    } catch {
      // Keep default
    }

    // 1. Fetch user's active shelf items
    const { data: shelfData, error: shelfError } = await supabase
      .from("coffee_shelf_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_finished", false)
      .order("created_at", { ascending: false });

    if (shelfError) {
      return NextResponse.json(
        { error: { code: 500, message: "원두 선반 정보를 가져오지 못했습니다.", details: shelfError.message } },
        { status: 500 }
      );
    }

    const shelfItems: ShelfItem[] = (shelfData || []).map(item => ({
      id: item.id,
      roaster_name: item.roaster_name,
      bean_name: item.bean_name,
      origin: item.origin,
      roast_date: item.roast_date,
      opened_date: item.opened_date,
      fill_level: item.fill_level,
    }));

    // 2. Fetch user's recent tasting passport tags for context
    const { data: passportData } = await supabase
      .from("tasting_cards")
      .select("tags")
      .eq("user_id", user.id)
      .limit(5);

    const userTags = Array.from(
      new Set((passportData || []).flatMap(card => card.tags || []))
    );

    // Resolve API key
    let env;
    try {
      env = readStarterEnv(process.env);
    } catch {
      env = { AI_API_KEY: process.env.AI_API_KEY };
    }
    const apiKey = env.AI_API_KEY;

    // Guard: Return local fallback if no valid API key
    if (!apiKey || apiKey === "your-gemini-or-openai-key" || apiKey.trim() === "") {
      const recommendation = generateLocalRecommendation(shelfItems, situation);
      return NextResponse.json({
        recommendation,
        warning: "AI API 키 설정 부재로 로컬 엔진이 추천한 가이드입니다."
      });
    }

    if (shelfItems.length === 0) {
      return NextResponse.json({
        recommendation: "현재 선반에 보관 중인 원두가 없습니다. 원두 선반(Coffee Shelf) 탭에서 원두를 등록하신 후 다시 요청해 주세요!",
        warning: "선반이 비어 있습니다."
      });
    }

    // Prepare prompt
    const shelfContext = shelfItems.map((item, idx) => 
      `${idx + 1}. [${item.roaster_name}] ${item.bean_name} (원산지/노트: ${item.origin || "미상"}, 로스팅일: ${item.roast_date || "미상"}, 개봉일: ${item.opened_date || "미상"}, 잔량: ${item.fill_level}%)`
    ).join("\n");

    const prompt = `당신은 대한민국 최고 수준의 스페셜티 커피 바리스타이자 커퍼(Cupper)입니다. 
사용자의 현재 상황/기분: "${situation}"

사용자가 현재 집에 보유하고 있는 원두 목록:
${shelfContext}

사용자의 과거 커피 취향 선호 태그: [${userTags.join(", ")}]

위 정보를 바탕으로 사용자가 오늘 최고의 홈카페 경험을 누릴 수 있도록 맞춤 에세이 및 브루잉 추천을 작성해 주세요. 
포함할 항목:
1. 상황에 어울리는 추천 원두 선정 이유
2. 해당 원두의 정밀 브루잉 레시피 (추출 기구 명시, 원두 그람수, 물 온도, 푸어 플로우 단계별 용량/초 가이드)
3. 만약 2개 이상의 원두가 있다면 흥미로운 블렌딩(Blending) 가능성 제시 (비율 설명)
4. 전문적이고 다정하며 감성적인 바리스타의 조언

어조 및 출력 형식:
- 마크다운(Markdown) 형식을 사용하여 제목과 불릿포인트를 가독성 있게 정리해 주세요.
- 한국어로 작성하되, 'CoffeeDex Taste Passport'의 모던하고 품격 있는 브랜드 이미지에 맞추어 지나치게 가볍거나 기계적인 번역투가 아닌 세련된 어조로 출력해 주세요.
- 인트로 멘트("안녕하세요", "추천 결과입니다" 등) 및 아웃트로 멘트는 생략하거나 최소화하고, 바로 본론 브루잉 레시피와 분석 가이드로 넘어가 주세요.`;

    if (apiKey.startsWith("sk-")) {
      // OpenAI Chat Completion
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      const recommendation = data.choices[0]?.message?.content?.trim() || generateLocalRecommendation(shelfItems, situation);
      return NextResponse.json({ recommendation });
    } else {
      // Gemini Generate Content
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
              temperature: 0.8,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const recommendation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || generateLocalRecommendation(shelfItems, situation);
      return NextResponse.json({ recommendation });
    }
  } catch (error: unknown) {
    // Graceful fallback to avoid breaking UI on network or token issues
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    let localShelfItems: ShelfItem[] = [];
    if (user) {
      const { data } = await supabase
        .from("coffee_shelf_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_finished", false);
      if (data) {
        localShelfItems = data.map(item => ({
          id: item.id,
          roaster_name: item.roaster_name,
          bean_name: item.bean_name,
          origin: item.origin,
          roast_date: item.roast_date,
          opened_date: item.opened_date,
          fill_level: item.fill_level,
        }));
      }
    }

    const recommendation = generateLocalRecommendation(localShelfItems, situation || "");
    return NextResponse.json({
      recommendation,
      warning: "AI API 호출 실패로 로컬 추천 템플릿 엔진을 실행했습니다.",
      details: getErrorMessage(error)
    });
  }
}
