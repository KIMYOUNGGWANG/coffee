import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { serializeCoffeeDexCsv, serializeCoffeeDexJson } from "@/lib/data-export";
import { createServerSupabase } from "@/lib/supabase/server";

const exportQuerySchema = z
  .object({
    format: z.enum(["json", "csv"]),
  })
  .strict()
  .readonly();

const responseByFormat = {
  csv: {
    contentType: "text/csv; charset=utf-8",
    serialize: serializeCoffeeDexCsv,
  },
  json: {
    contentType: "application/json; charset=utf-8",
    serialize: serializeCoffeeDexJson,
  },
} as const;

function errorResponse(status: 400 | 401 | 500, message: string): NextResponse {
  return NextResponse.json(
    { error: { code: status, message } },
    { status },
  );
}

function exportFilename(format: "json" | "csv"): string {
  const date = new Date().toISOString().slice(0, 10);
  return `coffeedex-memories-${date}.${format}`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const requestUrl = new URL(request.url);
  const query = exportQuerySchema.safeParse({
    format: requestUrl.searchParams.get("format"),
  });
  if (!query.success) {
    return errorResponse(400, "지원하지 않는 내보내기 형식입니다.");
  }

  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse(401, "인증되지 않은 사용자입니다. 로그인이 필요합니다.");
    }

    const [cards, notes, shelfItems, brewingLogs] = await Promise.all([
      supabase.from("tasting_cards").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("brewing_notes").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("coffee_shelf_items").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("brewing_logs").select("*")
        .eq("user_id", user.id).order("brewed_at", { ascending: false }),
    ]);

    if (cards.error || notes.error || shelfItems.error || brewingLogs.error) {
      return errorResponse(500, "데이터베이스 조회 중 오류가 발생했습니다.");
    }

    const format = query.data.format;
    const responseFormat = responseByFormat[format];
    const archive = {
      version: "1",
      exportedAt: new Date().toISOString(),
      tastingCards: cards.data ?? [],
      brewingNotes: notes.data ?? [],
      shelfItems: shelfItems.data ?? [],
      brewingLogs: brewingLogs.data ?? [],
    } as const;
    return new Response(responseFormat.serialize(archive), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${exportFilename(format)}"`,
        "Content-Type": responseFormat.contentType,
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return errorResponse(500, "서버 내부 오류가 발생했습니다.");
    }
    return errorResponse(500, "서버 내부 오류가 발생했습니다.");
  }
}
