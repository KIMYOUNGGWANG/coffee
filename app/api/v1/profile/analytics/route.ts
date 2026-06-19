import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import { buildPassportState } from "@/lib/passport-state";
import type { PassportCoverage, PassportState } from "@/lib/passport-state";
import { createServerSupabase } from "@/lib/supabase/server";

const repurchaseIntents = ["again", "maybe", "no", "undecided"] as const;
type RepurchaseIntent = (typeof repurchaseIntents)[number];

type RepurchaseBreakdown = Record<RepurchaseIntent, number>;

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function coverageSummary(coverage: PassportCoverage): string {
  switch (coverage) {
    case "narrow":
      return "기록 범위가 아직 좁아 취향으로 확정하지 않아요.";
    case "mixed":
      return "서로 다른 기록이 보이지만 현재 범위 안의 신호로만 읽어 주세요.";
    case "broad":
      return "원산지, 가공 방식, 향미가 비교적 고르게 쌓인 현재 기록의 스냅샷입니다.";
  }
}

function passportSummary(passport: PassportState, topNote: string | undefined): string {
  const note = topNote ? ` 가장 자주 남긴 향미는 ${topNote}입니다.` : " 아직 반복해서 남긴 향미는 없습니다.";
  const coverage = coverageSummary(passport.coverage);

  switch (passport.kind) {
    case "empty":
      return "아직 확정된 커피 기억이 없습니다. 첫 기록부터 패스포트가 시작됩니다.";
    case "collage":
      return `확정 기록 ${passport.sampleCount}개의 커피 기억 콜라주입니다.${note} ${coverage}`;
    case "first_signals":
      return `확정 기록 ${passport.sampleCount}개에서 첫 신호가 보입니다.${note} ${coverage}`;
    case "early_snapshot":
      return `확정 기록 ${passport.sampleCount}개로 만든 초기 스냅샷입니다.${note} ${coverage}`;
    case "current_snapshot":
      return `확정 기록 ${passport.sampleCount}개로 갱신한 현재 스냅샷입니다.${note} ${coverage}`;
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 401, message: "로그인이 필요합니다." } },
        { status: 401 },
      );
    }

    const { data: cards, error: cardsError } = await supabase
      .from("tasting_cards")
      .select("metric1, metric2, metric3, tags, package_origin, package_process, repurchase_intent, confirmed_at")
      .eq("user_id", user.id);
    const { data: notes, error: notesError } = await supabase
      .from("brewing_notes")
      .select("method, water_temp, rating")
      .eq("user_id", user.id);

    if (cardsError || notesError) {
      return NextResponse.json(
        { error: { code: 500, message: "패스포트 기록을 불러오는 중 오류가 발생했습니다." } },
        { status: 500 },
      );
    }

    const allCards = cards ?? [];
    const confirmedCards = allCards.filter((card) => typeof card.confirmed_at === "string");
    const passport = buildPassportState(confirmedCards.map((card) => ({
      origin: card.package_origin,
      process: card.package_process,
      tags: Array.isArray(card.tags) ? card.tags : [],
    })));

    const tagCounts = new Map<string, number>();
    for (const card of confirmedCards) {
      if (!Array.isArray(card.tags)) continue;
      for (const tag of card.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    const topNotes = [...tagCounts.entries()]
      .sort(([firstNote, firstCount], [secondNote, secondCount]) => secondCount - firstCount || firstNote.localeCompare(secondNote))
      .slice(0, 5)
      .map(([note, count]) => ({ note, count }));

    const repurchaseBreakdown: RepurchaseBreakdown = { again: 0, maybe: 0, no: 0, undecided: 0 };
    for (const card of confirmedCards) {
      const intent = repurchaseIntents.find((candidate) => candidate === card.repurchase_intent) ?? "undecided";
      repurchaseBreakdown[intent] += 1;
    }

    const brewingNotes = notes ?? [];
    const methodCounts = new Map<string, number>();
    const ratings: number[] = [];
    const highRatedTemperatures: number[] = [];
    for (const note of brewingNotes) {
      if (note.method) methodCounts.set(note.method, (methodCounts.get(note.method) ?? 0) + 1);
      if (typeof note.rating === "number" && note.rating > 0) ratings.push(note.rating);
      if (typeof note.rating === "number" && note.rating >= 4 && typeof note.water_temp === "number" && note.water_temp > 0) {
        highRatedTemperatures.push(note.water_temp);
      }
    }
    const favoriteMethod = [...methodCounts.entries()].sort(([, firstCount], [, secondCount]) => secondCount - firstCount)[0]?.[0] ?? "-";

    return NextResponse.json({
      data: {
        averageAcidity: average(confirmedCards.map((card) => card.metric1)),
        averageSweetness: average(confirmedCards.map((card) => card.metric2)),
        averageBody: average(confirmedCards.map((card) => card.metric3)),
        topTags: topNotes.map(({ note }) => note),
        topNotes,
        totalCards: allCards.length,
        aiAnalysis: passportSummary(passport, topNotes[0]?.note),
        passport,
        repurchaseBreakdown,
        brewingStats: {
          totalNotes: brewingNotes.length,
          favoriteMethod,
          averageRating: average(ratings),
          bestTemp: highRatedTemperatures.length > 0 ? Math.round(average(highRatedTemperatures)) : null,
        },
      },
    });
  } catch (error: unknown) { // no-excuse-ok: catch
    console.error("Passport analytics failed:", getErrorMessage(error));
    return NextResponse.json(
      { error: { code: 500, message: "서버 내부 오류가 발생했습니다." } },
      { status: 500 },
    );
  }
}
