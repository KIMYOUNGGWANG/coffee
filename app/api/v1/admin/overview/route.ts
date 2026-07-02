import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api-errors";
import {
  buildLaunchHealth,
  filterRealProductEvents,
  includesQaMarker,
  type AdminProductEventRow,
  type AdminStripeEventRow,
} from "@/lib/admin-launch-health";
import { createAdminDataClient, requireAdmin } from "@/lib/admin";
import { AdminSupabaseConfigurationError } from "@/lib/supabase/admin";

type ProfileRow = {
  readonly id: string;
  readonly email: string | null;
  readonly created_at: string;
  readonly updated_at: string | null;
  readonly is_premium: boolean | null;
  readonly scans_used: number | null;
  readonly monthly_scan_limit: number | null;
  readonly is_admin: boolean | null;
};

type TastingCardRow = {
  readonly id: string;
  readonly user_id: string;
  readonly title: string | null;
  readonly subtitle: string | null;
  readonly created_at: string;
  readonly confirmed_at: string | null;
  readonly purchase_url: string | null;
  readonly purchase_note: string | null;
  readonly repurchase_intent: string | null;
  readonly scan_source: string | null;
};

type ShelfItemRow = {
  readonly id: string;
  readonly user_id: string;
  readonly roaster_name: string | null;
  readonly bean_name: string | null;
  readonly created_at: string;
  readonly fill_level: number | null;
  readonly is_finished: boolean | null;
  readonly purchase_url: string | null;
  readonly purchase_note: string | null;
  readonly rebuy_action: string | null;
  readonly rebuy_priority: string | null;
  readonly rebuy_reminder_date: string | null;
};

type BrewingLogRow = {
  readonly id: string;
  readonly user_id: string;
  readonly shelf_item_id: string | null;
  readonly brewed_at: string;
  readonly method: string | null;
  readonly rating: number | null;
  readonly coach_source: string | null;
  readonly coach_feedback: string | null;
};

type QueryResult<T> = {
  readonly data: readonly T[] | null;
  readonly error: { readonly message: string } | null;
};

type AdminKpi = {
  readonly label: string;
  readonly value: number;
  readonly helper: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isAfter(value: string | null | undefined, threshold: Date): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time >= threshold.getTime();
}

function uniqueCount(values: readonly (string | null | undefined)[]): number {
  return new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0)).size;
}

function hasPurchaseMemory(row: Pick<TastingCardRow | ShelfItemRow, "purchase_url" | "purchase_note">): boolean {
  return Boolean(row.purchase_url || row.purchase_note);
}

function isRebuySignal(row: ShelfItemRow): boolean {
  return row.rebuy_priority === "pinned" || row.rebuy_action === "will_rebuy" || row.rebuy_action === "rebought" || Boolean(row.rebuy_reminder_date);
}

function latestTimestamp(...values: readonly (string | null | undefined)[]): string | null {
  const latest = values
    .map((value) => value ? new Date(value).getTime() : Number.NaN)
    .filter((time) => Number.isFinite(time))
    .sort((first, second) => second - first)[0];

  return latest === undefined ? null : new Date(latest).toISOString();
}

function responseError(status: number, message: string) {
  return NextResponse.json({ error: { code: status, message } }, { status });
}

function queryResult<T>(result: QueryResult<T>): QueryResult<T> {
  return result;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return responseError(admin.status, admin.message);
  }

  try {
    const supabase = createAdminDataClient();
    const [profilesResult, cardsResult, shelfResult, logsResult, eventsResult, stripeEventsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,created_at,updated_at,is_premium,scans_used,monthly_scan_limit,is_admin")
        .order("created_at", { ascending: false })
        .limit(500)
        .then((result) => queryResult<ProfileRow>(result)),
      supabase
        .from("tasting_cards")
        .select("id,user_id,title,subtitle,created_at,confirmed_at,purchase_url,purchase_note,repurchase_intent,scan_source")
        .order("created_at", { ascending: false })
        .limit(1000)
        .then((result) => queryResult<TastingCardRow>(result)),
      supabase
        .from("coffee_shelf_items")
        .select("id,user_id,roaster_name,bean_name,created_at,fill_level,is_finished,purchase_url,purchase_note,rebuy_action,rebuy_priority,rebuy_reminder_date")
        .order("created_at", { ascending: false })
        .limit(1000)
        .then((result) => queryResult<ShelfItemRow>(result)),
      supabase
        .from("brewing_logs")
        .select("id,user_id,shelf_item_id,brewed_at,method,rating,coach_source,coach_feedback")
        .order("brewed_at", { ascending: false })
        .limit(1000)
        .then((result) => queryResult<BrewingLogRow>(result)),
      supabase
        .from("product_events")
        .select("event_id,event_name,occurred_at,path,user_id,anonymous_id,properties")
        .order("occurred_at", { ascending: false })
        .limit(250)
        .then((result) => queryResult<AdminProductEventRow>(result)),
      supabase
        .from("stripe_events")
        .select("event_id,event_type,processing_status,created_at,updated_at,error_message")
        .order("created_at", { ascending: false })
        .limit(250)
        .then((result) => queryResult<AdminStripeEventRow>(result)),
    ]);

    const firstError = profilesResult.error ?? cardsResult.error ?? shelfResult.error ?? logsResult.error ?? eventsResult.error ?? stripeEventsResult.error;
    if (firstError) {
      return responseError(500, `관리자 데이터를 불러오지 못했습니다: ${firstError.message}`);
    }

    const profiles = profilesResult.data ?? [];
    const cards = cardsResult.data ?? [];
    const shelfItems = shelfResult.data ?? [];
    const logs = logsResult.data ?? [];
    const events = eventsResult.data ?? [];
    const realEvents = filterRealProductEvents(events);
    const stripeEvents = stripeEventsResult.data ?? [];
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const dashboardEvents = realEvents.filter((event) => event.event_name === "dashboard_view");
    const activeUsers7d = uniqueCount(realEvents.filter((event) => isAfter(event.occurred_at, sevenDaysAgo)).map((event) => event.user_id));
    const cardOwners = uniqueCount(cards.map((card) => card.user_id));
    const shelfOwners = uniqueCount(shelfItems.map((item) => item.user_id));
    const logOwners = uniqueCount(logs.map((log) => log.user_id));
    const purchaseOwners = uniqueCount([
      ...cards.filter(hasPurchaseMemory).map((card) => card.user_id),
      ...shelfItems.filter(hasPurchaseMemory).map((item) => item.user_id),
    ]);
    const feedbackLogs = logs.filter((log) => Boolean(log.coach_feedback));
    const rebuyItems = shelfItems.filter(isRebuySignal);
    const errorEvents = realEvents.filter((event) => event.event_name.includes("failed") || event.event_name.includes("support"));
    const adminUsers = profiles.filter((profile) => profile.is_admin === true).length;
    const launchHealth = buildLaunchHealth({ events, stripeEvents, now });
    const kpis: readonly AdminKpi[] = [
      { label: "전체 유저", value: profiles.length, helper: `오늘 신규 ${profiles.filter((profile) => isAfter(profile.created_at, today)).length}명` },
      { label: "7일 활성", value: activeUsers7d, helper: "최근 product_events 기준" },
      { label: "커피 메모리", value: cards.length + shelfItems.length, helper: `카드 ${cards.length}개 / 선반 ${shelfItems.length}개` },
      { label: "Dial-in 피드백", value: feedbackLogs.length, helper: `추출 로그 ${logs.length}개 중 저장` },
      { label: "재구매 신호", value: rebuyItems.length, helper: "고정/다시 살래요/리마인더" },
      { label: "운영 실패 로그", value: errorEvents.length, helper: "최근 250개 이벤트 중" },
    ];

    const funnel = [
      { label: "프로필 생성", users: profiles.length, helper: "Supabase auth → profiles" },
      { label: "대시보드 방문", users: uniqueCount(dashboardEvents.map((event) => event.user_id)), helper: "dashboard_view 이벤트" },
      { label: "첫 원두/카드 등록", users: uniqueCount([...cards.map((card) => card.user_id), ...shelfItems.map((item) => item.user_id)]), helper: `카드 ${cardOwners}명 / 선반 ${shelfOwners}명` },
      { label: "구매 단서 저장", users: purchaseOwners, helper: "purchase_url 또는 purchase_note" },
      { label: "첫 추출 로그", users: logOwners, helper: "brewing_logs 보유" },
      { label: "Brew Failure 저장", users: uniqueCount(feedbackLogs.map((log) => log.user_id)), helper: "coach_feedback 보유" },
      { label: "Rebuy 루프 진입", users: uniqueCount(rebuyItems.map((item) => item.user_id)), helper: "리마인더/재구매 액션" },
    ];

    const users = profiles.slice(0, 100).map((profile) => {
      const userCards = cards.filter((card) => card.user_id === profile.id);
      const userShelf = shelfItems.filter((item) => item.user_id === profile.id);
      const userLogs = logs.filter((log) => log.user_id === profile.id);
      const userEvents = realEvents.filter((event) => event.user_id === profile.id);
      return {
        id: profile.id,
        email: profile.email,
        createdAt: profile.created_at,
        isPremium: profile.is_premium === true,
        isAdmin: profile.is_admin === true,
        scansUsed: profile.scans_used ?? 0,
        monthlyScanLimit: profile.monthly_scan_limit ?? 0,
        cards: userCards.length,
        shelfItems: userShelf.length,
        brewLogs: userLogs.length,
        purchaseMemories: userCards.filter(hasPurchaseMemory).length + userShelf.filter(hasPurchaseMemory).length,
        latestActivityAt: latestTimestamp(
          userCards[0]?.created_at,
          userShelf[0]?.created_at,
          userLogs[0]?.brewed_at,
          userEvents[0]?.occurred_at,
          profile.updated_at,
        ),
      };
    });

    return NextResponse.json({
      data: {
        generatedAt: now.toISOString(),
        admin: {
          email: admin.user.email,
          source: admin.source,
        },
        kpis,
        launchHealth,
        funnel,
        memory: {
          tastingCards: cards.length,
          confirmedCards: cards.filter((card) => Boolean(card.confirmed_at)).length,
          shelfItems: shelfItems.length,
          activeShelfItems: shelfItems.filter((item) => item.is_finished !== true).length,
          purchaseMemories: cards.filter(hasPurchaseMemory).length + shelfItems.filter(hasPurchaseMemory).length,
          scanDrafts: cards.filter((card) => card.scan_source === "gemini").length,
        },
        rebuyDialIn: {
          rebuyCandidates: rebuyItems.length,
          pinnedRebuy: shelfItems.filter((item) => item.rebuy_priority === "pinned").length,
          willRebuy: shelfItems.filter((item) => item.rebuy_action === "will_rebuy").length,
          rebought: shelfItems.filter((item) => item.rebuy_action === "rebought").length,
          brewingLogs: logs.length,
          coachFeedbackLogs: feedbackLogs.length,
          feedbackBreakdown: ["too_sour", "too_bitter", "too_weak", "too_heavy", "balanced"].map((feedback) => ({
            feedback,
            count: feedbackLogs.filter((log) => log.coach_feedback === feedback).length,
          })),
        },
        users,
        operations: {
          adminUsers,
          recentFailures: errorEvents.slice(0, 20).map((event) => ({
            id: event.event_id,
            eventName: event.event_name,
            occurredAt: event.occurred_at,
            path: event.path,
            userId: event.user_id,
          })),
        },
        qaCandidates: [
          ...cards
            .filter((card) => includesQaMarker(card.title, card.subtitle))
            .map((card) => ({ type: "tasting_card", id: card.id, userId: card.user_id, label: `${card.title ?? "Untitled"} / ${card.subtitle ?? "No roaster"}`, createdAt: card.created_at })),
          ...shelfItems
            .filter((item) => includesQaMarker(item.roaster_name, item.bean_name))
            .map((item) => ({ type: "shelf_item", id: item.id, userId: item.user_id, label: `${item.bean_name ?? "Untitled"} / ${item.roaster_name ?? "No roaster"}`, createdAt: item.created_at })),
        ].slice(0, 50),
      },
    });
  } catch (error: unknown) {
    if (error instanceof AdminSupabaseConfigurationError) {
      return responseError(503, "관리자 서비스롤 설정이 필요합니다.");
    }

    return NextResponse.json(
      { error: { code: 500, message: "관리자 대시보드를 불러오지 못했습니다.", details: getErrorMessage(error) } },
      { status: 500 },
    );
  }
}
