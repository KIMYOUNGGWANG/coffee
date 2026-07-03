import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { readStarterEnv } from "@/lib/env";
import { z } from "zod";

const aiBaristaRequestSchema = z.object({
  situation: z.string().optional().default("아침 깨어남"), // "아침 깨어남", "오후 나른함", "비 오는 날", "디저트와 함께" 등
  beanId: z.string().optional(),
  feedback: z.enum(["too_sour", "too_bitter", "too_watery", "perfect"]).optional(),
  agingDays: z.number().optional(),
  recentLogs: z.array(z.any()).optional(),
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
function generateLocalRecommendation(
  shelfItems: ShelfItem[],
  situation: string,
  feedback?: "too_sour" | "too_bitter" | "too_watery" | "perfect"
): string {
  if (shelfItems.length === 0) {
    return "현재 원두 선반이 비어 있습니다. 향미 원두 보관함에 맛있는 원두를 등록하면 오늘 상황에 맞는 브루잉 가이드를 받을 수 있습니다. 먼저 마켓이나 로스터리에서 구한 원두를 선반에 올려두는 것부터 시작해보세요.";
  }

  // Pick the first item to generate recommendation
  const primaryItem = shelfItems[0];
  const beanTitle = `[${primaryItem.roaster_name}] ${primaryItem.bean_name}`;
  
  if (feedback) {
    if (feedback === "too_sour") {
      return `### 신맛 보정 튜닝 가이드
**${beanTitle}** 원두 추출 결과, 신맛이 너무 강하게 느껴지셨군요. 다음 추출을 위한 보정 레시피 가이드라인입니다:

*   **추출수 온도 조절:** 추출수 온도를 기존보다 **2°C 올려서** 추출해 보세요. 온도가 높아지면 단맛과 바디감 성분이 더 많이 추출되어 날카로운 신맛이 부드러워집니다.
*   **분쇄도 조정:** 원두 분쇄도를 지금보다 **더 곱게(Finer)** 조절해 보세요. 물과의 접촉 면적이 넓어져 추출 효율이 향상됩니다.
*   **추출 속도(푸어 페이스):** 물줄기를 평소보다 **천천히 흘려보내(Slower Pour)** 추출 시간을 늘려 깊은 맛 성분을 충분히 끌어내 보세요.

	> **바리스타의 한마디:** 온도를 높이고 푸어링 속도를 늦추어 밸런스 잡힌 브루잉을 경험해 보세요.`;
    } else if (feedback === "too_bitter") {
      return `### 쓴맛 보정 튜닝 가이드
**${beanTitle}** 원두 추출 결과, 쓴맛이 너무 강하게 느껴지셨군요. 다음 추출을 위한 보정 레시피 가이드라인입니다:

*   **추출수 온도 조절:** 추출수 온도를 기존보다 **2°C 낮추어** 추출해 보세요. 높은 온도로 인해 원두 표면에서 쓴맛 성분이 과하게 추출되는 것을 방지합니다.
*   **분쇄도 조정:** 원두 분쇄도를 지금보다 **더 굵게(Coarser)** 조절해 보세요. 채널링을 예방하고 잡미가 물에 녹아 나오는 과다 추출 현상을 막아줍니다.
*   **추출 속도(푸어 페이스):** 물줄기를 평소보다 **빠르게 부어(Faster Pour)** 추출 시간을 단축시켜 산뜻하고 깔끔한 컵을 유도해 보세요.

> **바리스타의 한마디:** 온도를 낮추고 물을 시원하게 부어 쓴맛을 산뜻하게 걷어내 보세요.`;
    } else if (feedback === "too_watery") {
      return `### 싱겁고 연한 맛 보정 튜닝 가이드
**${beanTitle}** 원두 추출 결과, 맛이 싱겁고 연하게 느껴지셨군요. 다음 추출을 위한 보정 레시피 가이드라인입니다:

*   **추출 비율(Ratio) 조절:** 커피 가루 대비 추출수 용량 비율을 **더 좁혀서(Narrower Ratio)** 추출해 보세요. 원두의 고형분 농도를 높여 한층 진한 풍미를 선사합니다.
*   **분쇄도 조정:** 분쇄도를 지금보다 **더 곱게(Finer)** 조절해 보세요. 물과 원두 가루의 접촉 면적이 넓어져 추출력이 크게 향상됩니다.
*   **뜸 들이기(Blooming) 연장:** 뜸 들이는 시간(Blooming)을 **더 길게(Longer Blooming)** 유지하여 원두 내부 가스를 완전히 배출하고 성분이 고르게 추출되도록 해보세요.

> **바리스타의 한마디:** 뜸 시간을 늘려 가스를 배출하고 분쇄도를 미세하게 조절해 진하게 내려보세요.`;
    } else if (feedback === "perfect") {
      return `### 골든 레시피 도달
	**${beanTitle}** 원두의 좋은 맛 밸런스를 찾으셨군요.

*   **레시피 매개변수 유효성 검증 완료:** 현재의 브루잉 매개변수(분쇄도, 추출수 온도, 추출 비율, 푸어링 페이스)는 향미 표현에 최적화된 상태로 확인되었습니다.
*   **레시피 동결(Freeze):** 현재의 매개변수를 골든 레시피 표준 설정으로 성공적으로 고정했습니다. 앞으로 이 원두를 추출할 때 일관되게 최상의 컵을 구현하실 수 있습니다.

	> **바리스타의 한마디:** 이 세팅은 맛의 변수가 가장 적은 상태로 고정됩니다.`;
    }
  }

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
    recommendationText += `\n\n**스페셜 블렌딩 팁:** 보유 중이신 **${primaryItem.bean_name}**과 **${secondaryItem.bean_name}** 원두를 6:4 비율로 섞어 브루잉해 보세요. 새로운 복합적 아로마와 긴 여운을 만나보실 수 있습니다.`;
  }

  return recommendationText;
}

// POST /api/v1/ai-barista - AI Barista Recommendation Engine
export async function POST(request: NextRequest) {
  let situation = "아침 깨어남";
  let beanId: string | undefined;
  let feedback: "too_sour" | "too_bitter" | "too_watery" | "perfect" | undefined;
  let agingDays: number | undefined;
  let recentLogs: any[] | undefined;

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
        beanId = result.data.beanId;
        feedback = result.data.feedback;
        agingDays = result.data.agingDays;
        recentLogs = result.data.recentLogs;
      }
    } catch {
      // Keep default
    }

    // 1. Fetch user's active shelf items (or specific beanId if provided)
    let shelfItems: ShelfItem[] = [];
    if (beanId) {
      // beanId from frontend is usually tasting_card_id
      const { data: itemData, error: itemError } = await supabase
        .from("coffee_shelf_items")
        .select("*")
        .eq("tasting_card_id", beanId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (itemData) {
        shelfItems = [{
          id: itemData.id,
          roaster_name: itemData.roaster_name,
          bean_name: itemData.bean_name,
          origin: itemData.origin,
          roast_date: itemData.roast_date,
          opened_date: itemData.opened_date,
          fill_level: itemData.fill_level,
        }];
        
        // Automatically calculate agingDays if not provided
        if (agingDays === undefined && itemData.roast_date) {
          const roastDate = new Date(itemData.roast_date);
          const diffTime = Math.abs(new Date().getTime() - roastDate.getTime());
          agingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      // Automatically fetch recentLogs if not provided
      if (recentLogs === undefined) {
        const { data: logsData } = await supabase
          .from("brewing_notes")
          .select("method, water_temp, grind_size, brew_time, bean_amount, water_amount, rating, memo")
          .eq("tasting_card_id", beanId)
          .order("created_at", { ascending: false })
          .limit(3);
        if (logsData && logsData.length > 0) {
          recentLogs = logsData;
        }
      }
    }

    if (shelfItems.length === 0) {
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

      shelfItems = (shelfData || []).map(item => ({
        id: item.id,
        roaster_name: item.roaster_name,
        bean_name: item.bean_name,
        origin: item.origin,
        roast_date: item.roast_date,
        opened_date: item.opened_date,
        fill_level: item.fill_level,
      }));
    }

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
      const recommendation = generateLocalRecommendation(shelfItems, situation, feedback);
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

    const agingContext = agingDays !== undefined ? `원두 에이징 상태(로스팅 후 지난 일수): ${agingDays}일` : "";
    const logsContext = recentLogs && recentLogs.length > 0 
      ? `최근 브루잉 로그 기록:\n${JSON.stringify(recentLogs, null, 2)}` 
      : "최근 기록 없음";

    let prompt = "";
    if (feedback) {
      prompt = `당신은 대한민국 최고 수준의 스페셜티 커피 바리스타이자 커퍼(Cupper)입니다. 
사용자가 마신 커피 원두:
${shelfContext}

${agingContext}
${logsContext}

사용자의 맛 피드백: "${feedback}" (too_sour: 너무 신맛, too_bitter: 너무 쓴맛, too_watery: 싱겁거나 연함, perfect: 완벽함)

위 피드백을 바탕으로 사용자가 다음 브루잉에서 더 완벽한 컵을 완성할 수 있도록 맞춤 튜닝 가이드를 작성해 주세요. 

구체적인 튜닝 가이드라인:
- 'too_sour': 추출수 온도를 2°C 올리거나, 더 곱게 분쇄하거나, 푸어링(물붓기) 속도를 늦추어 추출 시간을 늘릴 것을 제안합니다.
- 'too_bitter': 추출수 온도를 2°C 낮추거나, 더 굵게 분쇄하거나, 푸어링 속도를 빠르게 하여 추출 시간을 줄일 것을 제안합니다.
- 'too_watery': 커피 대 물의 비율을 좁히거나(커피 용량 대비 물의 양을 줄여 더 진하게), 더 곱게 분쇄하거나, 뜸 들이는 시간을 늘려 추출력을 강화할 것을 제안합니다.
- 'perfect': 현재의 레시피 매개변수를 성공적으로 확인 및 고정(freeze)함을 알리고, 사용자에게 축하와 격려의 메세지를 전달합니다.

어조 및 출력 형식:
- 마크다운(Markdown) 형식을 사용하여 제목과 불릿포인트를 가독성 있게 정리해 주세요.
- 한국어로 작성하되, 'CoffeeDex Taste Passport'의 모던하고 품격 있는 브랜드 이미지에 맞추어 지나치게 가볍거나 기계적인 번역투가 아닌 세련된 어조로 출력해 주세요.
- 사용자에게 직접적이고 실용적인 튜닝 팁을 전하고, 마지막에 격려의 코멘트를 덧붙여 주세요.`;
    } else {
      prompt = `당신은 대한민국 최고 수준의 스페셜티 커피 바리스타이자 커퍼(Cupper)입니다. 
사용자의 현재 상황/기분: "${situation}"

${agingContext}
${logsContext}

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
    }

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
      const recommendation = data.choices[0]?.message?.content?.trim() || generateLocalRecommendation(shelfItems, situation, feedback);
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
      const recommendation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || generateLocalRecommendation(shelfItems, situation, feedback);
      return NextResponse.json({ recommendation });
    }
  } catch (error: unknown) {
    // Graceful fallback to avoid breaking UI on network or token issues
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    let localShelfItems: ShelfItem[] = [];
    if (user) {
      if (beanId) {
        const { data } = await supabase
          .from("coffee_shelf_items")
          .select("*")
          .eq("id", beanId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          localShelfItems = [{
            id: data.id,
            roaster_name: data.roaster_name,
            bean_name: data.bean_name,
            origin: data.origin,
            roast_date: data.roast_date,
            opened_date: data.opened_date,
            fill_level: data.fill_level,
          }];
        }
      }
      if (localShelfItems.length === 0) {
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
    }

    const recommendation = generateLocalRecommendation(localShelfItems, situation || "", feedback);
    return NextResponse.json({
      recommendation,
      warning: "AI API 호출 실패로 로컬 추천 템플릿 엔진을 실행했습니다.",
      details: getErrorMessage(error)
    });
  }
}
