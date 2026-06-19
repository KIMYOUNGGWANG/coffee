import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { publicTastingCardSchema } from "@/lib/public-card";

type RouteParams = {
  readonly params: Promise<{ readonly token: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("tasting_cards")
      .select(`
        id,
        category,
        title,
        subtitle,
        image_url,
        badges,
        metric1,
        metric2,
        metric3,
        tags,
        ai_description,
        footer_meta,
        public_share_token,
        created_at,
        updated_at
      `)
      .eq("public_share_token", token)
      .eq("is_public", true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 404, message: "공개 CoffeeDex 카드를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    const parsedCard = publicTastingCardSchema.safeParse(data);
    if (!parsedCard.success) {
      return NextResponse.json(
        { error: { code: 500, message: "공개 카드 형식이 올바르지 않습니다.", details: parsedCard.error.format() } },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: parsedCard.data });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: { code: 500, message: "공개 카드 조회 중 오류가 발생했습니다.", details } },
      { status: 500 },
    );
  }
}
