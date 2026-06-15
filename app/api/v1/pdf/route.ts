import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { hyangmiBrand } from "@/lib/brand";
import { generateHyangmiTastePassportPdf } from "@/lib/pdf-generator";
import { createServerSupabase } from "@/lib/supabase/server";

const profileSchema = z.object({
  has_pdf_access: z.boolean(),
});

const tastingCardSchema = z.object({
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  metric1: z.number().nullable().optional(),
  metric2: z.number().nullable().optional(),
  metric3: z.number().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  ai_description: z.string().nullable().optional(),
});

const tastingCardsSchema = z.array(tastingCardSchema);

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

    // Verify PDF purchase status on user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("has_pdf_access")
      .eq("id", user.id)
      .single();

    const profileResult = profileSchema.safeParse(profile);

    if (profileError || !profileResult.success) {
      return NextResponse.json(
        { error: { code: 500, message: "프로필 정보를 불러올 수 없습니다." } },
        { status: 500 }
      );
    }

    if (!profileResult.data.has_pdf_access) {
      return NextResponse.json(
        { error: { code: 403, message: "PDF 홈카페 기록북 다운로드 권한이 없습니다. 먼저 결제를 완료해주세요." } },
        { status: 403 }
      );
    }

    // Fetch all cards to bundle inside the PDF compilation
    const { data: cards, error: cardsError } = await supabase
      .from("tasting_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (cardsError) {
      return NextResponse.json(
        { error: { code: 500, message: "카드 데이터를 가져오지 못했습니다.", details: cardsError.message } },
        { status: 500 }
      );
    }

    const cardsResult = tastingCardsSchema.safeParse(cards ?? []);
    if (!cardsResult.success) {
      return NextResponse.json(
        { error: { code: 500, message: "카드 데이터를 PDF 형식으로 변환하지 못했습니다." } },
        { status: 500 }
      );
    }

    const exportedAt = new Date().toISOString();
    const ownerLabel = user.email?.split("@")[0] ?? "Hyangmi user";
    const pdfBytes = generateHyangmiTastePassportPdf({
      ownerLabel,
      exportedAt,
      cards: cardsResult.data,
    });
    const filename = `${hyangmiBrand.filenameSlug}-taste-passport-${exportedAt.slice(0, 10)}.pdf`;

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
        "Content-Type": "application/pdf",
      },
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다.", details } },
      { status: 500 }
    );
  }
}
