import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";
import { z } from "zod";

// Zod schema to validate tasting card creation requests
const createCardSchema = z.object({
  category: z.enum(["coffee", "beer", "whiskey", "wine"]),
  title: z.string().min(1, "이름을 입력해주세요."),
  subtitle: z.string().min(1, "로스터리/브랜드를 입력해주세요."),
  imageUrl: z.string().url().nullable().optional(),
  badges: z.array(z.string()).default([]),
  metric1: z.number().int().min(1).max(5), // Coffee: Acidity
  metric2: z.number().int().min(1).max(5), // Coffee: Sweetness
  metric3: z.number().int().min(1).max(5), // Coffee: Body
  tags: z.array(z.string()).default([]),
  aiDescription: z.string().default(""),
  footerMeta: z.object({
    origin: z.string().optional(),
    date: z.string().optional(),
    extraInfo: z.string().optional(),
  }).default({}),
});

// GET /api/v1/cards - Retrieve tasting cards for authenticated user
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

    // Fetch cards owned by user
    const { data, error } = await supabase
      .from("tasting_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

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

// POST /api/v1/cards - Create a new tasting card
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

    // Parse and validate request body
    const body = await request.json();
    const result = createCardSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 400, message: "입력 데이터 유효성 검사에 실패했습니다.", details: result.error.format() } },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Insert new tasting card into Supabase
    const { data, error } = await supabase
      .from("tasting_cards")
      .insert({
        user_id: user.id,
        category: validatedData.category,
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        image_url: validatedData.imageUrl || null,
        badges: validatedData.badges,
        metric1: validatedData.metric1,
        metric2: validatedData.metric2,
        metric3: validatedData.metric3,
        tags: validatedData.tags,
        ai_description: validatedData.aiDescription,
        footer_meta: validatedData.footerMeta,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 500, message: "카드를 저장하는 과정에서 오류가 발생했습니다.", details: error.message } },
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
