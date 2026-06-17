import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

const updateBrewingNoteSchema = z.object({
  method: z.string().min(1, "추출 도구를 입력해주세요.").optional(),
  beanAmount: z.number().positive("원두 양은 0보다 커야 합니다.").optional(),
  waterAmount: z.number().positive("추출(물) 양은 0보다 커야 합니다.").optional(),
  grindSize: z.string().nullable().optional(),
  waterTemp: z.number().nullable().optional(),
  brewTime: z.number().int().nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  memo: z.string().nullable().optional(),
});

type RouteParams = {
  params: Promise<{ id: string; noteId: string }>;
};

// PATCH /api/v1/cards/[id]/brewing-notes/[noteId] - Update a specific brewing note
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cardId, noteId } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Verify note ownership and card ID mapping
    const { data: note, error: noteError } = await supabase
      .from("brewing_notes")
      .select("id")
      .eq("id", noteId)
      .eq("tasting_card_id", cardId)
      .eq("user_id", user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { error: { code: 404, message: "추출 노트를 찾을 수 없거나 권한이 없습니다." } },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const result = updateBrewingNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "올바른 데이터를 입력해주세요.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const val = result.data;
    const updatePayload: Record<string, any> = {};
    if (val.method !== undefined) updatePayload.method = val.method;
    if (val.beanAmount !== undefined) updatePayload.bean_amount = val.beanAmount;
    if (val.waterAmount !== undefined) updatePayload.water_amount = val.waterAmount;
    if (val.grindSize !== undefined) updatePayload.grind_size = val.grindSize;
    if (val.waterTemp !== undefined) updatePayload.water_temp = val.waterTemp;
    if (val.brewTime !== undefined) updatePayload.brew_time = val.brewTime;
    if (val.rating !== undefined) updatePayload.rating = val.rating;
    if (val.memo !== undefined) updatePayload.memo = val.memo;

    // Update note
    const { data: updatedNote, error: updateError } = await supabase
      .from("brewing_notes")
      .update(updatePayload)
      .eq("id", noteId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: { code: 500, message: "추출 노트를 수정하는 도중 오류가 발생했습니다.", details: updateError.message } },
        { status: 500 }
      );
    }

    // Update updated_at of the parent tasting card
    await supabase
      .from("tasting_cards")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cardId);

    return NextResponse.json({ data: updatedNote });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/cards/[id]/brewing-notes/[noteId] - Delete a specific brewing note
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: cardId, noteId } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Verify note ownership
    const { data: note, error: noteError } = await supabase
      .from("brewing_notes")
      .select("id")
      .eq("id", noteId)
      .eq("tasting_card_id", cardId)
      .eq("user_id", user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { error: { code: 404, message: "추출 노트를 찾을 수 없거나 권한이 없습니다." } },
        { status: 404 }
      );
    }

    // Delete note
    const { error: deleteError } = await supabase
      .from("brewing_notes")
      .delete()
      .eq("id", noteId);

    if (deleteError) {
      return NextResponse.json(
        { error: { code: 500, message: "추출 노트를 삭제하는 도중 오류가 발생했습니다.", details: deleteError.message } },
        { status: 500 }
      );
    }

    // Update updated_at of the parent tasting card
    await supabase
      .from("tasting_cards")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", cardId);

    return NextResponse.json({ data: { id: noteId, success: true } });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
