import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
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

    // Fetch all coffee shelf items for this user
    const { data: shelfItems, error } = await supabase
      .from("coffee_shelf_items")
      .select("*, tasting_cards(*)")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "데이터베이스 조회 중 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    const totalBeans = shelfItems?.length || 0;

    // 1. Average rating calculation (only for items with a rating)
    const ratedItems = shelfItems.filter(item => item.rating !== null && item.rating !== undefined);
    const averageRating = ratedItems.length > 0 
      ? Number((ratedItems.reduce((acc, curr) => acc + curr.rating, 0) / ratedItems.length).toFixed(1))
      : null;

    // 2. Want again rate (0 - 100)
    const wantAgainCount = shelfItems.filter(item => item.want_again === true).length;
    const wantAgainRate = totalBeans > 0 
      ? Math.round((wantAgainCount / totalBeans) * 100)
      : 0;

    // Helper for cleaning origin string
    const cleanOrigin = (org: string | null): string => {
      if (!org) return "";
      return org.split(",")[0].trim();
    };

    // 3. Top Origins
    const originMap: Record<string, number> = {};
    shelfItems.forEach(item => {
      const origin = cleanOrigin(item.origin);
      if (origin) {
        originMap[origin] = (originMap[origin] || 0) + 1;
      }
    });
    const topOrigins = Object.entries(originMap)
      .map(([origin, count]) => ({ origin, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Top Roasters
    const roasterMap: Record<string, number> = {};
    shelfItems.forEach(item => {
      const roaster = item.roaster_name ? item.roaster_name.trim() : "";
      if (roaster) {
        roasterMap[roaster] = (roasterMap[roaster] || 0) + 1;
      }
    });
    const topRoasters = Object.entries(roasterMap)
      .map(([roaster, count]) => ({ roaster, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Taste Profile average (using metric1, metric2, metric3 from joined tasting_cards)
    const itemsWithCards = shelfItems.filter(item => item.tasting_cards !== null && item.tasting_cards !== undefined);
    let tasteProfile: { acidity: number; sweetness: number; body: number } | null = null;

    if (itemsWithCards.length > 0) {
      const totalAcidity = itemsWithCards.reduce((acc, item) => acc + (item.tasting_cards.metric1 || 0), 0);
      const totalSweetness = itemsWithCards.reduce((acc, item) => acc + (item.tasting_cards.metric2 || 0), 0);
      const totalBody = itemsWithCards.reduce((acc, item) => acc + (item.tasting_cards.metric3 || 0), 0);
      
      tasteProfile = {
        acidity: Number((totalAcidity / itemsWithCards.length).toFixed(1)),
        sweetness: Number((totalSweetness / itemsWithCards.length).toFixed(1)),
        body: Number((totalBody / itemsWithCards.length).toFixed(1)),
      };
    }

    // 6. DNA Type Label logic
    let acidCount = 0;
    let balanceCount = 0;
    let bodyCount = 0;

    shelfItems.forEach(item => {
      const org = (item.origin || "").toLowerCase();
      if (org.includes("에티오피아") || org.includes("ethiopia") || org.includes("케냐") || org.includes("kenya") || org.includes("파나마") || org.includes("panama")) {
        acidCount++;
      } else if (org.includes("콜롬비아") || org.includes("colombia") || org.includes("과테말라") || org.includes("guatemala") || org.includes("코스타리카") || org.includes("costa rica")) {
        balanceCount++;
      } else if (org.includes("인도네시아") || org.includes("indonesia") || org.includes("브라질") || org.includes("brazil")) {
        bodyCount++;
      }
    });

    const distinctOrigins = new Set(
      shelfItems
        .map(item => cleanOrigin(item.origin))
        .filter(Boolean)
    );

    let typeLabel = "커피 탐험 시작 ☕";
    if (totalBeans > 0) {
      if (acidCount > balanceCount && acidCount > bodyCount) {
        typeLabel = "과일향 탐험가 🍊";
      } else if (balanceCount > acidCount && balanceCount > bodyCount) {
        typeLabel = "클래식 밸런스 ⚖️";
      } else if (bodyCount > acidCount && bodyCount > balanceCount) {
        typeLabel = "다크 로스트 마니아 🌑";
      } else if (distinctOrigins.size >= 3) {
        typeLabel = "세계 미각 여행자 🌍";
      } else {
        // Fallbacks based on individual counts
        if (acidCount > 0) typeLabel = "과일향 탐험가 🍊";
        else if (balanceCount > 0) typeLabel = "클래식 밸런스 ⚖️";
        else if (bodyCount > 0) typeLabel = "다크 로스트 마니아 🌑";
        else typeLabel = "세계 미각 여행자 🌍";
      }
    }

    return NextResponse.json({
      data: {
        totalBeans,
        averageRating,
        wantAgainRate,
        topOrigins,
        topRoasters,
        tasteProfile,
        typeLabel,
      }
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
