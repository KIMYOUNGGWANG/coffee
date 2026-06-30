import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

const purchaseUrlSchema = z.string().trim().url().max(500).optional().nullable();
const purchaseNoteSchema = z.string().trim().min(1).max(160).optional().nullable();

const updateShelfItemSchema = z.object({
  roasterName: z.string().optional(),
  beanName: z.string().optional(),
  origin: z.string().optional().nullable(),
  roastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.").optional().nullable(),
  openedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "올바른 날짜 형식(YYYY-MM-DD)이어야 합니다.").optional().nullable(),
  totalWeight: z.number().int().min(1).optional(),
  fillLevel: z.number().int().min(0).max(100).optional(),
  isFinished: z.boolean().optional(),
  tastingCardId: z.string().uuid().optional().nullable(),
  purchaseUrl: purchaseUrlSchema,
  purchaseNote: purchaseNoteSchema,
});

type UpdateShelfItemPayload = {
  roaster_name?: string;
  bean_name?: string;
  origin?: string | null;
  roast_date?: string | null;
  opened_date?: string | null;
  total_weight?: number;
  fill_level?: number;
  is_finished?: boolean;
  tasting_card_id?: string | null;
  purchase_url?: string | null;
  purchase_note?: string | null;
};

// PATCH /api/v1/shelf/[id] - Update a specific shelf item (e.g., adjust fill level)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const result = updateShelfItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Build update object mapping camelCase to snake_case
    const updateData: UpdateShelfItemPayload = {};
    if (validatedData.roasterName !== undefined) updateData.roaster_name = validatedData.roasterName;
    if (validatedData.beanName !== undefined) updateData.bean_name = validatedData.beanName;
    if (validatedData.origin !== undefined) updateData.origin = validatedData.origin;
    if (validatedData.roastDate !== undefined) updateData.roast_date = validatedData.roastDate;
    if (validatedData.openedDate !== undefined) updateData.opened_date = validatedData.openedDate;
    if (validatedData.totalWeight !== undefined) updateData.total_weight = validatedData.totalWeight;
    if (validatedData.tastingCardId !== undefined) updateData.tasting_card_id = validatedData.tastingCardId;
    if (validatedData.purchaseUrl !== undefined) updateData.purchase_url = validatedData.purchaseUrl;
    if (validatedData.purchaseNote !== undefined) updateData.purchase_note = validatedData.purchaseNote;

    if (validatedData.fillLevel !== undefined) {
      updateData.fill_level = validatedData.fillLevel;
      // If fill level becomes 0, automatically mark as finished
      if (validatedData.fillLevel === 0) {
        updateData.is_finished = true;
      } else {
        updateData.is_finished = false;
      }
    }

    if (validatedData.isFinished !== undefined) {
      updateData.is_finished = validatedData.isFinished;
      // If manually marked finished, set fill level to 0
      if (validatedData.isFinished) {
        updateData.fill_level = 0;
      }
    }

    const { data, error } = await supabase
      .from("coffee_shelf_items")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "선반 아이템을 수정하는 과정에서 오류가 발생했습니다.", details: error.message } },
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

// DELETE /api/v1/shelf/[id] - Delete a specific shelf item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("coffee_shelf_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "선반 아이템 삭제 중 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "선반 아이템이 성공적으로 삭제되었습니다." });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
