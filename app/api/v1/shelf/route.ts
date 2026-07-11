import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

const purchaseUrlSchema = z.string().trim().url().max(500).optional().nullable();
const purchaseNoteSchema = z.string().trim().min(1).max(160).optional().nullable();
const rebuyPrioritySchema = z.enum(["normal", "pinned", "paused"]).optional();
const rebuyReminderDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.").optional().nullable();
const rebuyActionSchema = z.enum(["none", "drank", "will_rebuy", "rebought"]).optional();

const createShelfItemSchema = z.object({
  roasterName: z.string().min(1, "로스터리 이름을 입력해주세요."),
  beanName: z.string().min(1, "원두 이름을 입력해주세요."),
  origin: z.string().optional().nullable(),
  roastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.").optional().nullable(),
  openedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.").optional().nullable(),
  totalWeight: z.number().int().min(1, "무게는 1g 이상이어야 합니다.").default(200),
  fillLevel: z.number().int().min(0).max(100).default(100),
  tastingCardId: z.string().uuid().optional().nullable(),
  purchaseUrl: purchaseUrlSchema,
  purchaseNote: purchaseNoteSchema,
  rebuyPriority: rebuyPrioritySchema,
  rebuyReminderDate: rebuyReminderDateSchema,
  rebuyAction: rebuyActionSchema,
  rebuySourceShelfItemId: z.string().uuid().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  wantAgain: z.boolean().optional().nullable(),
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
    const rebuySourceShelfItemId = validatedData.rebuySourceShelfItemId ?? null;

    if (rebuySourceShelfItemId) {
      const { data: sourceItem, error: sourceError } = await supabase
        .from("coffee_shelf_items")
        .select("id")
        .eq("id", rebuySourceShelfItemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (sourceError) {
        return NextResponse.json({ error: { code: 500, message: "재구매 원본을 확인하지 못했습니다.", details: sourceError.message } }, { status: 500 });
      }
      if (!sourceItem) {
        return NextResponse.json({ error: { code: 404, message: "재구매 원본을 찾을 수 없습니다." } }, { status: 404 });
      }

      const { data: existingItem, error: existingError } = await supabase
        .from("coffee_shelf_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("rebuy_source_shelf_item_id", rebuySourceShelfItemId)
        .maybeSingle();

      if (existingError) {
        return NextResponse.json({ error: { code: 500, message: "기존 재구매 기록을 확인하지 못했습니다.", details: existingError.message } }, { status: 500 });
      }
      if (existingItem) return NextResponse.json({ data: existingItem, reused: true });
    }

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
        purchase_url: validatedData.purchaseUrl ?? null,
        purchase_note: validatedData.purchaseNote ?? null,
        rebuy_priority: validatedData.rebuyPriority ?? "normal",
        rebuy_reminder_date: validatedData.rebuyReminderDate ?? null,
        rebuy_action: validatedData.rebuyAction ?? "none",
        rebuy_source_shelf_item_id: rebuySourceShelfItemId,
        rebuy_action_at: validatedData.rebuyAction && validatedData.rebuyAction !== "none" ? new Date().toISOString() : null,
        rating: validatedData.rating || null,
        want_again: validatedData.wantAgain ?? false,
      })
      .select()
      .single();

    if (error?.code === "23505" && rebuySourceShelfItemId) {
      const { data: existingItem } = await supabase
        .from("coffee_shelf_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("rebuy_source_shelf_item_id", rebuySourceShelfItemId)
        .maybeSingle();

      if (existingItem) return NextResponse.json({ data: existingItem, reused: true });
    }

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "선반 아이템 저장 중 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, reused: false }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
