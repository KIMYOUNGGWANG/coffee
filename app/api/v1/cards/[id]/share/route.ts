import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createPublicCardUrl } from "@/lib/public-card";
import { createServerSupabase } from "@/lib/supabase/server";

type RouteParams = {
  readonly params: Promise<{ readonly id: string }>;
};

const shareUpdateResultSchema = z.object({
  public_share_token: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("tasting_cards")
      .update({ is_public: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("public_share_token")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 404, message: "공개할 카드를 찾을 수 없거나 권한이 없습니다." } },
        { status: 404 },
      );
    }

    const parsedResult = shareUpdateResultSchema.safeParse(data);
    if (!parsedResult.success) {
      return NextResponse.json(
        { error: { code: 500, message: "공개 링크 토큰을 만들지 못했습니다." } },
        { status: 500 },
      );
    }

    const publicShareToken = parsedResult.data.public_share_token;
    return NextResponse.json({
      data: {
        publicShareToken,
        publicUrl: createPublicCardUrl(request.nextUrl.origin, publicShareToken),
      },
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { error: { code: 500, message: "공개 링크 생성 중 오류가 발생했습니다.", details } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("tasting_cards")
      .update({ is_public: false, public_share_token: randomUUID() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 404, message: "카드를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: { revoked: true } });
  } catch {
    return NextResponse.json(
      { error: { code: 500, message: "공개 링크 해제 중 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
