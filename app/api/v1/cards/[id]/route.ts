import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

// Zod schema for card updates (all fields optional)
const updateCardSchema = z.object({
  title: z.string().min(1, "이름을 입력해주세요.").optional(),
  subtitle: z.string().min(1, "로스터리/브랜드를 입력해주세요.").optional(),
  imageUrl: z.string().url().nullable().optional(),
  badges: z.array(z.string()).optional(),
  metric1: z.number().int().min(1).max(5).optional(),
  metric2: z.number().int().min(1).max(5).optional(),
  metric3: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  aiDescription: z.string().optional(),
  footerMeta: z.object({
    origin: z.string().optional(),
    date: z.string().optional(),
    extraInfo: z.string().optional(),
  }).optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type CardFooterMeta = {
  origin?: string;
  date?: string;
  extraInfo?: string;
};

type UpdateCardPayload = {
  title?: string;
  subtitle?: string;
  image_url?: string | null;
  badges?: string[];
  metric1?: number;
  metric2?: number;
  metric3?: number;
  tags?: string[];
  ai_description?: string;
  footer_meta?: CardFooterMeta;
};

// GET /api/v1/cards/:id - Retrieve a single tasting card
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Retrieve the card. RLS will automatically ensure the user owns this card.
    const { data, error } = await supabase
      .from("tasting_cards")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 404, message: "카드를 찾을 수 없거나 접근 권한이 없습니다." } },
        { status: 404 }
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

// PATCH /api/v1/cards/:id - Update a tasting card
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Parse and validate body
    const body = await request.json();
    const result = updateCardSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Prepare update object matching DB snake_case naming
    const updatePayload: UpdateCardPayload = {};
    if (validatedData.title !== undefined) updatePayload.title = validatedData.title;
    if (validatedData.subtitle !== undefined) updatePayload.subtitle = validatedData.subtitle;
    if (validatedData.imageUrl !== undefined) updatePayload.image_url = validatedData.imageUrl;
    if (validatedData.badges !== undefined) updatePayload.badges = validatedData.badges;
    if (validatedData.metric1 !== undefined) updatePayload.metric1 = validatedData.metric1;
    if (validatedData.metric2 !== undefined) updatePayload.metric2 = validatedData.metric2;
    if (validatedData.metric3 !== undefined) updatePayload.metric3 = validatedData.metric3;
    if (validatedData.tags !== undefined) updatePayload.tags = validatedData.tags;
    if (validatedData.aiDescription !== undefined) updatePayload.ai_description = validatedData.aiDescription;
    if (validatedData.footerMeta !== undefined) updatePayload.footer_meta = validatedData.footerMeta;

    // Perform update. RLS ensures only owner updates.
    const { data, error } = await supabase
      .from("tasting_cards")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id) // Extra safety check alongside RLS
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 404, message: "카드를 수정할 수 없습니다. 권한이 없거나 카드가 존재하지 않습니다." } },
        { status: 404 }
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

// DELETE /api/v1/cards/:id - Delete a tasting card
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Perform deletion
    const { error } = await supabase
      .from("tasting_cards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Extra safety check alongside RLS

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "카드를 삭제하는 과정에서 오류가 발생했습니다.", details: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "카드가 성공적으로 삭제되었습니다." }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}
