import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";

// GET /api/v1/brewing-logs/ghost - Retrieve a simulated ghost recipe
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

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get("cardId");

    if (!cardId) {
      return NextResponse.json(
        { error: { code: 400, message: "cardId 파라미터가 필요합니다." } },
        { status: 400 }
      );
    }

    // Return a simulated ghost recipe JSON as requested
    const ghostRecipe = {
      twinScore: 96,
      method: "Hario V60",
      parameters: {
        waterTemp: 94,
        waterAmount: 230,
        coffeeAmount: 15,
        grindSize: "Medium Fine",
        brewTime: "2:15"
      },
      simpleNote: "고스트 바리스타의 추천 레시피 (익명 유저)"
    };

    return NextResponse.json({ data: ghostRecipe });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
