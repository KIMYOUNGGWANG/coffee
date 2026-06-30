import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { buildDialInCoach } from "@/lib/dial-in-coach";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "인증되지 않은 사용자입니다. 로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    const [shelfResult, logsResult] = await Promise.all([
      supabase
        .from("coffee_shelf_items")
        .select("id,roaster_name,bean_name,origin,roast_date,opened_date,fill_level,is_finished")
        .eq("user_id", user.id)
        .eq("is_finished", false)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("brewing_logs")
        .select("id,shelf_item_id,brewed_at,method,parameters,rating,simple_note,coach_feedback")
        .eq("user_id", user.id)
        .order("brewed_at", { ascending: false })
        .limit(30),
    ]);

    const firstError = shelfResult.error ?? logsResult.error;
    if (firstError) {
      return NextResponse.json(
        { error: { code: 500, message: "다이얼인 코치를 계산하지 못했습니다.", details: firstError.message } },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: buildDialInCoach({
        shelfItems: shelfResult.data ?? [],
        brewingLogs: logsResult.data ?? [],
      }),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 },
    );
  }
}
