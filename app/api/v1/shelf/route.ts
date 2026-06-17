import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

const createShelfItemSchema = z.object({
  roasterName: z.string().min(1, "로스터리 이름을 입력해주세요."),
  beanName: z.string().min(1, "원두 이름을 입력해주세요."),
  origin: z.string().optional().nullable(),
  roastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.").optional().nullable(),
  openedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.").optional().nullable(),
  totalWeight: z.number().int().min(1, "무게는 1g 이상이어야 합니다.").default(200),
  fillLevel: z.number().int().min(0).max(100).default(100),
  tastingCardId: z.string().uuid().optional().nullable(),
});

// GET /api/v1/shelf - Get active or archived shelf items
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
    const includeFinished = searchParams.get("include_finished") === "true";

    let query = supabase
      .from("coffee_shelf_items")
      .select("*, tasting_cards(*)")
      .eq("user_id", user.id);

    if (!includeFinished) {
      query = query.eq("is_finished", false);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "데이터베이스 조회 중 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// POST /api/v1/shelf - Add a new item to coffee shelf
export async function POST(request: NextRequest) {
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
    const result = createShelfItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    const { data, error } = await supabase
      .from("coffee_shelf_items")
      .insert({
        user_id: user.id,
        roaster_name: validatedData.roasterName,
        bean_name: validatedData.beanName,
        origin: validatedData.origin || null,
        roast_date: validatedData.roastDate || null,
        opened_date: validatedData.openedDate || null,
        total_weight: validatedData.totalWeight,
        fill_level: validatedData.fillLevel,
        is_finished: validatedData.fillLevel === 0,
        tasting_card_id: validatedData.tastingCardId || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "선반 아이템 저장 중 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
