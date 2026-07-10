import { NextResponse } from "next/server";

import {
  RebuyCalendarInputError,
  buildRebuyReminderCalendar,
  missingRebuyReminderDateMessage,
  rebuyReminderCalendarFilename,
  type RebuyCalendarShelfItem,
} from "@/lib/rebuy-calendar";
import { createServerSupabase } from "@/lib/supabase/server";

type RouteContext = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

function jsonError(status: 400 | 401 | 404 | 500, message: string): NextResponse {
  return NextResponse.json(
    { error: { code: status, message } },
    { status },
  );
}

export async function GET(request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonError(401, "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
    }

    const { data, error } = await supabase
      .from("coffee_shelf_items")
      .select("id,roaster_name,bean_name,rebuy_reminder_date")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return jsonError(404, "선반 아이템을 찾을 수 없습니다.");
      }
      return jsonError(500, "캘린더 내보내기를 준비하지 못했습니다.");
    }

    if (!data) {
      return jsonError(404, "선반 아이템을 찾을 수 없습니다.");
    }

    if (!data.rebuy_reminder_date) {
      return jsonError(400, missingRebuyReminderDateMessage);
    }

    const shelfItem: RebuyCalendarShelfItem = {
      id: data.id,
      roaster_name: data.roaster_name,
      bean_name: data.bean_name,
      rebuy_reminder_date: data.rebuy_reminder_date,
    };
    const calendarText = buildRebuyReminderCalendar({
      shelfItem,
      origin: request.url,
    });

    return new Response(calendarText, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${rebuyReminderCalendarFilename(data.rebuy_reminder_date)}"`,
        "Content-Type": "text/calendar; charset=utf-8",
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    if (error instanceof RebuyCalendarInputError) {
      return jsonError(400, missingRebuyReminderDateMessage);
    }

    return jsonError(500, "서버 내부 오류가 발생했습니다.");
  }
}
