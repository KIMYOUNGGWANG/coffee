import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { buildRebuyIntelligence } from "@/lib/rebuy-intelligence";
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

    const [cardsResult, shelfResult, brewLogsResult] = await Promise.all([
      supabase
        .from("tasting_cards")
        .select("id,title,subtitle,metric1,metric2,metric3,tags,repurchase_intent,repurchase_reasons,scan_source,package_origin,package_process,footer_meta,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("coffee_shelf_items")
        .select("id,roaster_name,bean_name,origin,roast_date,opened_date,fill_level,is_finished,tasting_card_id,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("brewing_logs")
        .select("id,shelf_item_id,brewed_at,method,parameters,rating,simple_note,coffee_shelf_items(id,roaster_name,bean_name,origin,roast_date,opened_date,fill_level,is_finished,tasting_card_id,created_at)")
        .eq("user_id", user.id)
        .order("brewed_at", { ascending: false })
        .limit(40),
    ]);

    const firstError = cardsResult.error ?? shelfResult.error ?? brewLogsResult.error;
    if (firstError) {
      return NextResponse.json(
        { error: { code: 500, message: "재구매 인텔리전스를 계산하지 못했습니다.", details: firstError.message } },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: buildRebuyIntelligence({
        cards: cardsResult.data ?? [],
        shelfItems: shelfResult.data ?? [],
        brewingLogs: brewLogsResult.data ?? [],
      }),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details: getErrorMessage(error) } },
      { status: 500 },
    );
  }
}
