import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { readStarterEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Fetch tasting cards
    const { data: cards, error: cardsError } = await supabase
      .from("tasting_cards")
      .select("metric1, metric2, metric3, tags, title, subtitle")
      .eq("user_id", user.id);

    if (cardsError) {
      return NextResponse.json(
        { error: { code: 500, message: "테이스팅 카드를 불러오는 중 오류가 발생했습니다.", details: cardsError.message } },
        { status: 500 }
      );
    }

    // Default response if no cards yet
    if (!cards || cards.length === 0) {
      return NextResponse.json({
        data: {
          averageAcidity: 0,
          averageSweetness: 0,
          averageBody: 0,
          topTags: [],
          totalCards: 0,
          aiAnalysis: "아직 등록된 테이스팅 카드가 없습니다. 첫 카드를 기록하시면 AI가 정교한 취향 분석을 시작합니다.",
        }
      });
    }

    // Aggregations
    let totalAcidity = 0;
    let totalSweetness = 0;
    let totalBody = 0;
    const tagCounts: Record<string, number> = {};

    cards.forEach((card) => {
      totalAcidity += card.metric1;
      totalSweetness += card.metric2;
      totalBody += card.metric3;
      if (Array.isArray(card.tags)) {
        card.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const totalCards = cards.length;
    const averageAcidity = Math.round((totalAcidity / totalCards) * 10) / 10;
    const averageSweetness = Math.round((totalSweetness / totalCards) * 10) / 10;
    const averageBody = Math.round((totalBody / totalCards) * 10) / 10;

    // Get top tags sorted by count
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Call Gemini to generate coffee taste story
    let env;
    try {
      env = readStarterEnv(process.env);
    } catch {
      env = { AI_API_KEY: process.env.AI_API_KEY };
    }

    const apiKey = env.AI_API_KEY;

    let aiAnalysis = `등록된 ${totalCards}개의 원두 기록을 바탕으로 분석한 결과, 평균적으로 산미는 ${averageAcidity}점, 단맛은 ${averageSweetness}점, 바디감은 ${averageBody}점을 선호하시는 경향이 있습니다. 선호하는 주요 노트는 [${topTags.join(", ")}]입니다.`;

    if (apiKey && apiKey !== "your-gemini-or-openai-key" && apiKey.trim() !== "") {
      try {
        const prompt = `Based on a coffee lover's drinking logs:
- Total coffees tasted: ${totalCards}
- Average Acidity: ${averageAcidity}/5
- Average Sweetness: ${averageSweetness}/5
- Average Body: ${averageBody}/5
- Top flavor profiles selected: [${topTags.join(", ")}]

Generate a personalized, witty, and beautiful 2-3 sentence coffee lover "Taste Profile Analysis" in Korean. Call them a nickname like "현대적 내추럴 탐험가" or "클래식 에스프레소 애호가" based on metrics (e.g. high acidity => fruity/african beans explorer, high body/sweetness => classic robust flavors lover). Keep the tone warm, intellectual, and poetic (like wine description). Do not output markdown, prefixes, quotes, or JSON. Just Korean text.`;

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
                maxOutputTokens: 150,
              },
            }),
          }
        );

        if (response.ok) {
          const resJson = await response.json();
          const generatedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generatedText) {
            aiAnalysis = generatedText;
          }
        }
      } catch (err) {
        console.error("AI Taste profiling generation error:", err);
      }
    } else {
      // Elegant local mock storytelling if API key is not configured
      if (averageAcidity >= 3.8) {
        aiAnalysis = `유저님은 에티오피아와 케냐 등 아프리카 계열 원두가 주는 화사하고 쥬시한 산미를 사랑하는 '싱그러운 아로마 탐험가'입니다. 특히 V60 드립 추출에서 가벼운 바디감과 과일 향미의 만족도가 높게 나타납니다.`;
      } else if (averageSweetness >= 3.8 && averageBody >= 3.5) {
        aiAnalysis = `유저님은 캐러멜의 달콤함과 밀크 초콜릿의 부드럽고 묵직한 마우스필을 선호하는 '클래식 로스트 애호가'입니다. 밸런스가 뛰어나고 단맛의 여운이 길게 남는 커피를 즐기시네요.`;
      } else {
        aiAnalysis = `유저님은 산미, 단맛, 바디감이 한쪽으로 치우치지 않고 정교하게 어우러진 맛의 균형을 중시하는 '균형주의 홈바리스타'입니다. 다양한 원두와 브루잉 변수를 차분히 탐구하며 취향을 확장하고 계십니다.`;
      }
    }

    return NextResponse.json({
      data: {
        averageAcidity,
        averageSweetness,
        averageBody,
        topTags,
        totalCards,
        aiAnalysis,
      }
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
