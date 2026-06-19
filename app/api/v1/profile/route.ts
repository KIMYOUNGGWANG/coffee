import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Authenticate user
    // TEMPORARY BYPASS: mock user
    const user = { id: "mock-user-123" };
    const authError = null;

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // Retrieve profiles information (credits, has_pdf_access, is_premium, scans_used, monthly_scan_limit)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, has_pdf_access, is_premium, scans_used, monthly_scan_limit")
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
