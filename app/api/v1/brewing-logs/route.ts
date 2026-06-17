import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

const createBrewingLogSchema = z.object({
  shelfItemId: z.string().uuid().optional().nullable(),
  brewedAt: z.string().datetime().optional(),
  method: z.string().min(1, "추출 방식을 입력해주세요."),
  parameters: z.object({
    waterTemp: z.number().optional().nullable(),
    waterAmount: z.number().optional().nullable(),
    coffeeAmount: z.number().optional().nullable(),
    grindSize: z.string().optional().nullable(),
    brewTime: z.string().optional().nullable(),
  }).default({}),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  simpleNote: z.string().optional().nullable(),
});

// GET /api/v1/brewing-logs - Fetch brewing logs for authenticated user
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
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query = supabase
      .from("brewing_logs")
      .select("*, coffee_shelf_items(*)")
      .eq("user_id", user.id);

    if (startDate) {
      query = query.gte("brewed_at", startDate);
    }
    if (endDate) {
      query = query.lte("brewed_at", endDate);
    }

    const { data, error } = await query
      .order("brewed_at", { ascending: false })
      .limit(limit);

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

// POST /api/v1/brewing-logs - Create a new brewing log
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
    const result = createBrewingLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    const { data, error } = await supabase
      .from("brewing_logs")
      .insert({
        user_id: user.id,
        shelf_item_id: validatedData.shelfItemId || null,
        brewed_at: validatedData.brewedAt || new Date().toISOString(),
        method: validatedData.method,
        parameters: validatedData.parameters,
        rating: validatedData.rating || null,
        simple_note: validatedData.simpleNote || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "추출 로그 저장 중 오류가 발생했습니다.", details: error.message } },
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
