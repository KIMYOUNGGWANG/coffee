import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

const updateBrewingLogSchema = z.object({
  shelfItemId: z.string().uuid().optional().nullable(),
  brewedAt: z.string().datetime().optional(),
  method: z.string().optional(),
  parameters: z.object({
    waterTemp: z.number().optional().nullable(),
    waterAmount: z.number().optional().nullable(),
    coffeeAmount: z.number().optional().nullable(),
    grindSize: z.string().optional().nullable(),
    brewTime: z.string().optional().nullable(),
  }).optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  simpleNote: z.string().optional().nullable(),
});

// PATCH /api/v1/brewing-logs/[id] - Update a specific brewing log
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
    const result = updateBrewingLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Build update object mapping camelCase to snake_case
    const updateData: Record<string, any> = {};
    if (validatedData.shelfItemId !== undefined) updateData.shelf_item_id = validatedData.shelfItemId;
    if (validatedData.brewedAt !== undefined) updateData.brewed_at = validatedData.brewedAt;
    if (validatedData.method !== undefined) updateData.method = validatedData.method;
    if (validatedData.parameters !== undefined) updateData.parameters = validatedData.parameters;
    if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;
    if (validatedData.simpleNote !== undefined) updateData.simple_note = validatedData.simpleNote;

    const { data, error } = await supabase
      .from("brewing_logs")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "추출 로그 수정 중 오류가 발생했습니다.", details: error.message } },
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

// DELETE /api/v1/brewing-logs/[id] - Delete a specific brewing log
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
      .from("brewing_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "추출 로그 삭제 중 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "추출 로그가 성공적으로 삭제되었습니다." });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
