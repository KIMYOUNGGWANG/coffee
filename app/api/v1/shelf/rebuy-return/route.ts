import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabase } from "@/lib/supabase/server";

const rebuyReturnTokenSchema = z.string().uuid();

function jsonError(status: 400 | 401 | 404 | 500, message: string): NextResponse {
  return NextResponse.json({ error: { code: status, message } }, { status });
}

export async function GET(request: Request): Promise<Response> {
  const token = rebuyReturnTokenSchema.safeParse(new URL(request.url).searchParams.get("token"));
  if (!token.success) {
    return jsonError(400, "유효한 재구매 복귀 링크가 아닙니다.");
  }

  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonError(401, "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
    }

    const { data, error } = await supabase
      .from("coffee_shelf_items")
      .select("id,roaster_name,bean_name,rebuy_action")
      .eq("rebuy_return_token", token.data)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return jsonError(404, "재구매 기억을 찾을 수 없습니다.");
      }
      return jsonError(500, "재구매 기억을 불러오지 못했습니다.");
    }

    if (!data) {
      return jsonError(404, "재구매 기억을 찾을 수 없습니다.");
    }

    return NextResponse.json(
      {
        data: {
          id: data.id,
          roasterName: data.roaster_name,
          beanName: data.bean_name,
          rebuyAction: data.rebuy_action,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return jsonError(500, "서버 내부 오류가 발생했습니다.");
  }
}
