import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

const createBrewingNoteSchema = z.object({
  method: z.string().min(1, "추출 도구를 입력해주세요."),
  beanAmount: z.number().positive("원두 양은 0보다 커야 합니다."),
  waterAmount: z.number().positive("추출(물) 양은 0보다 커야 합니다."),
  grindSize: z.string().nullable().optional(),
  waterTemp: z.number().nullable().optional(),
  brewTime: z.number().int().nullable().optional(), // in seconds
  rating: z.number().int().min(1).max(5).nullable().optional(),
  memo: z.string().nullable().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/v1/cards/[id]/brewing-notes - Retrieve all brewing notes for a tasting card
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cardId } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Verify card ownership
    const { data: card, error: cardError } = await supabase
      .from("tasting_cards")
      .select("id")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: { code: 404, message: "원두 카드를 찾을 수 없거나 권한이 없습니다." } },
        { status: 404 }
      );
    }

    // Fetch notes
    const { data: notes, error: notesError } = await supabase
      .from("brewing_notes")
      .select("*")
      .eq("tasting_card_id", cardId)
      .order("created_at", { ascending: false });

    if (notesError) {
      return NextResponse.json(
        { error: { code: 500, message: "추출 노트를 조회하는 도중 오류가 발생했습니다.", details: notesError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: notes });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// POST /api/v1/cards/[id]/brewing-notes - Append a new brewing note
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cardId } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Verify card ownership
    const { data: card, error: cardError } = await supabase
      .from("tasting_cards")
      .select("id")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: { code: 404, message: "원두 카드를 찾을 수 없거나 권한이 없습니다." } },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const result = createBrewingNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "올바른 데이터를 입력해주세요.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const val = result.data;

    // Insert note
    const { data: note, error: insertError } = await supabase
      .from("brewing_notes")
      .insert({
        tasting_card_id: cardId,
        user_id: user.id,
        method: val.method,
        bean_amount: val.beanAmount,
        water_amount: val.waterAmount,
        grind_size: val.grindSize || null,
        water_temp: val.waterTemp || null,
        brew_time: val.brewTime || null,
        rating: val.rating || null,
        memo: val.memo || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: { code: 500, message: "추출 노트를 저장하는 도중 오류가 발생했습니다.", details: insertError.message } },
        { status: 500 }
      );
    }

    // Update updated_at of the parent tasting card
    await supabase
      .from("tasting_cards")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cardId);

    return NextResponse.json({ data: note }, { status: 201 });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
