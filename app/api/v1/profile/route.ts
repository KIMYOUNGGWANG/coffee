import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";

const profileFields = "credits, has_pdf_access, is_premium, scans_used, monthly_scan_limit, personal_taste_line";
const profileUpdateSchema = z.object({
  personalTasteLine: z.string().trim().min(1).max(160).nullable(),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Retrieve profiles information (credits, has_pdf_access, is_premium, scans_used, monthly_scan_limit)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(profileFields)
      .eq("id", user.id)
      .single();

    if (profileError) {
      // If profile does not exist in DB yet, return default credits (1) and default limits
      if (profileError.code === "PGRST116") {
        return NextResponse.json({
          data: {
            credits: 1,
            has_pdf_access: false,
            is_premium: false,
            scans_used: 0,
            monthly_scan_limit: 5,
            personal_taste_line: null,
          }
        });
      }
      return NextResponse.json(
        { error: { code: 500, message: "프로필 조회를 실패했습니다.", details: profileError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: profile });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: { code: 400, message: "요청 본문이 올바른 JSON이 아닙니다." } },
          { status: 400 },
        );
      }
      throw error;
    }

    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 400, message: "취향 문장은 1자 이상 160자 이하로 입력해주세요." } },
        { status: 400 },
      );
    }

    const { data: profiles, error: profileError } = await supabase.rpc(
      "update_personal_taste_line",
      { new_personal_taste_line: parsed.data.personalTasteLine },
    );

    const profile = Array.isArray(profiles) ? profiles[0] : null;
    if (profileError || !profile) {
      return NextResponse.json(
        { error: { code: 500, message: "취향 문장을 저장하지 못했습니다." } },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: profile });
  } catch (error: unknown) {
    console.error("Personal taste line update failed:", getErrorMessage(error));
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
