"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Coffee,
  DatabaseZap,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { AdminLaunchHealthPanel } from "@/components/admin-launch-health-panel";
import type { LaunchHealth } from "@/lib/admin-launch-health";

type AdminKpi = {
  readonly label: string;
  readonly value: number;
  readonly helper: string;
};

type FunnelStep = {
  readonly label: string;
  readonly users: number;
  readonly helper: string;
};

type AdminUser = {
  readonly id: string;
  readonly email: string | null;
  readonly createdAt: string;
  readonly isPremium: boolean;
  readonly isAdmin: boolean;
  readonly scansUsed: number;
  readonly monthlyScanLimit: number;
  readonly cards: number;
  readonly shelfItems: number;
  readonly brewLogs: number;
  readonly purchaseMemories: number;
  readonly latestActivityAt: string | null;
};

type FailureLog = {
  readonly id: string;
  readonly eventName: string;
  readonly occurredAt: string;
  readonly path: string;
  readonly userId: string | null;
};

type QaCandidate = {
  readonly type: "tasting_card" | "shelf_item";
  readonly id: string;
  readonly userId: string;
  readonly label: string;
  readonly createdAt: string;
};

type AdminOverview = {
  readonly generatedAt: string;
  readonly admin: {
    readonly email: string | null;
    readonly source: "email_allowlist" | "profile_role";
  };
  readonly kpis: readonly AdminKpi[];
  readonly launchHealth: LaunchHealth;
  readonly funnel: readonly FunnelStep[];
  readonly memory: {
    readonly tastingCards: number;
    readonly confirmedCards: number;
    readonly shelfItems: number;
    readonly activeShelfItems: number;
    readonly purchaseMemories: number;
    readonly scanDrafts: number;
  };
  readonly rebuyDialIn: {
    readonly rebuyCandidates: number;
    readonly pinnedRebuy: number;
    readonly willRebuy: number;
    readonly rebought: number;
    readonly brewingLogs: number;
    readonly coachFeedbackLogs: number;
    readonly feedbackBreakdown: readonly {
      readonly feedback: string;
      readonly count: number;
    }[];
  };
  readonly users: readonly AdminUser[];
  readonly operations: {
    readonly adminUsers: number;
    readonly recentFailures: readonly FailureLog[];
  };
  readonly qaCandidates: readonly QaCandidate[];
};

type AdminState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly overview: AdminOverview }
  | { readonly kind: "error"; readonly status: number; readonly message: string };

type ApiErrorBody = {
  readonly error?: {
    readonly code?: number | string;
    readonly message?: string;
  };
};

function formatDate(value: string | null): string {
  if (!value) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function feedbackLabel(value: string): string {
  const labels: Record<string, string> = {
    too_sour: "시다",
    too_bitter: "쓰다",
    too_weak: "묽다",
    too_heavy: "텁텁",
    balanced: "균형",
  };
  return labels[value] ?? value;
}

async function readApiError(response: Response): Promise<string> {
  const body = await response.json() as ApiErrorBody;
  return body.error?.message ?? `${response.status} ${response.statusText}`.trim();
}

function MetricPanel({ icon, kpi }: { readonly icon: ReactNode; readonly kpi: AdminKpi }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/80">{kpi.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{kpi.value.toLocaleString("ko-KR")}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#A3A3A3]">{kpi.helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-[#D4AF37]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AccessMessage({ state, onRetry }: { readonly state: Extract<AdminState, { kind: "error" }>; readonly onRetry: () => void }) {
  const isAuthError = state.status === 401 || state.status === 403;
  return (
    <main className="min-h-[100dvh] bg-black px-5 py-10 text-white">
      <section className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.045] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">관리자 접근이 필요합니다</h1>
        <p className="mt-3 text-sm leading-7 text-[#A3A3A3]">{state.message}</p>
        <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
          {isAuthError && (
            <a
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-[#120B07] shadow-[0_12px_36px_rgba(212,175,55,0.18)] transition hover:bg-white"
              href="/auth?redirect=/admin"
            >
              Google로 로그인
            </a>
          )}
          <button
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-[#D4AF37]/70"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            다시 확인
          </button>
        </div>
      </section>
    </main>
  );
}

export default function AdminDashboardClient() {
  const [state, setState] = useState<AdminState>({ kind: "loading" });
  const [cleanupBusy, setCleanupBusy] = useState(false);

  async function loadOverview() {
    setState({ kind: "loading" });
    const response = await fetch("/api/v1/admin/overview", { cache: "no-store" });
    if (!response.ok) {
      setState({ kind: "error", status: response.status, message: await readApiError(response) });
      return;
    }
    const body = await response.json() as { readonly data: AdminOverview };
    setState({ kind: "ready", overview: body.data });
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  const icons = useMemo(() => [Users, BarChart3, Coffee, DatabaseZap, ShieldCheck, AlertTriangle], []);

  async function cleanupQaData() {
    if (state.kind !== "ready" || state.overview.qaCandidates.length === 0) return;
    const confirmed = window.confirm("QA/test로 표시된 후보 데이터만 정리합니다. 계속할까요?");
    if (!confirmed) return;

    setCleanupBusy(true);
    try {
      const response = await fetch("/api/v1/admin/qa-cleanup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!response.ok) {
        window.alert(await readApiError(response));
        return;
      }
      await loadOverview();
    } finally {
      setCleanupBusy(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-black px-5 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border border-white/15 border-t-[#D4AF37]" aria-label="관리자 데이터 로딩" />
      </main>
    );
  }

  if (state.kind === "error") {
    return <AccessMessage state={state} onRetry={() => void loadOverview()} />;
  }

  const { overview } = state;
  const maxFunnelUsers = Math.max(1, ...overview.funnel.map((step) => step.users));

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              CoffeeDex Operating Room
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">관리자 대시보드</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#A3A3A3]">
              출시 후 매일 확인할 KPI, activation funnel, 커피 메모리 상태, 재구매와 다이얼인 사용 흐름을 한 화면에 모았습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white hover:border-[#D4AF37]/70" href="/dashboard">
              사용자 대시보드
            </a>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-[#D4AF37]"
              onClick={() => void loadOverview()}
              type="button"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              새로고침
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {overview.kpis.map((kpi, index) => {
            const Icon = icons[index] ?? BarChart3;
            return <MetricPanel icon={<Icon className="h-5 w-5" aria-hidden="true" />} key={kpi.label} kpi={kpi} />;
          })}
        </section>

        <AdminLaunchHealthPanel health={overview.launchHealth} />

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Activation Funnel</h2>
                <p className="mt-1 text-sm text-[#A3A3A3]">첫 방문부터 재구매 루프까지의 이탈 구간을 봅니다.</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[#A3A3A3]">{formatDate(overview.generatedAt)}</span>
            </div>
            <div className="mt-5 space-y-4">
              {overview.funnel.map((step) => {
                const width = `${Math.max(6, Math.round((step.users / maxFunnelUsers) * 100))}%`;
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{step.label}</span>
                      <span className="text-[#D4AF37]">{step.users.toLocaleString("ko-KR")}명</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#D4AF37]" style={{ width }} />
                    </div>
                    <p className="mt-1 text-xs text-[#A3A3A3]">{step.helper}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5">
            <section className="rounded-[30px] border border-white/10 bg-[#120B07] p-5">
              <h2 className="text-xl font-semibold">Coffee Memory 상태</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["카드", overview.memory.tastingCards],
                  ["확정 카드", overview.memory.confirmedCards],
                  ["선반", overview.memory.shelfItems],
                  ["활성 선반", overview.memory.activeShelfItems],
                  ["구매 단서", overview.memory.purchaseMemories],
                  ["스캔 초안", overview.memory.scanDrafts],
                ].map(([label, value]) => (
                  <div className="rounded-2xl bg-white/[0.055] p-4" key={label}>
                    <p className="text-xs text-[#A3A3A3]">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{Number(value).toLocaleString("ko-KR")}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5">
              <h2 className="text-xl font-semibold">Rebuy / Dial-in</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p>후보 <b className="block text-2xl text-[#D4AF37]">{overview.rebuyDialIn.rebuyCandidates}</b></p>
                <p>피드백 <b className="block text-2xl text-[#D4AF37]">{overview.rebuyDialIn.coachFeedbackLogs}</b></p>
                <p>다시 살래요 <b className="block text-xl">{overview.rebuyDialIn.willRebuy}</b></p>
                <p>재구매 완료 <b className="block text-xl">{overview.rebuyDialIn.rebought}</b></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {overview.rebuyDialIn.feedbackBreakdown.map((item) => (
                  <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-[#A3A3A3]" key={item.feedback}>
                    {feedbackLabel(item.feedback)} {item.count}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045]">
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">유저 / 계정 목록</h2>
              <p className="mt-1 text-sm text-[#A3A3A3]">최근 생성 100명 기준, 개인 데이터 내용이 아니라 사용 상태만 봅니다.</p>
            </div>
            <span className="text-sm text-[#A3A3A3]">관리자 {overview.operations.adminUsers}명</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-[#A3A3A3]">
                <tr>
                  <th className="px-5 py-3">계정</th>
                  <th className="px-5 py-3">메모리</th>
                  <th className="px-5 py-3">추출</th>
                  <th className="px-5 py-3">구매 단서</th>
                  <th className="px-5 py-3">스캔</th>
                  <th className="px-5 py-3">최근 활동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {overview.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{user.email ?? shortId(user.id)}</p>
                      <p className="text-xs text-[#A3A3A3]">{user.isAdmin ? "admin" : user.isPremium ? "premium" : "standard"}</p>
                    </td>
                    <td className="px-5 py-4">{user.cards} cards / {user.shelfItems} shelf</td>
                    <td className="px-5 py-4">{user.brewLogs}</td>
                    <td className="px-5 py-4">{user.purchaseMemories}</td>
                    <td className="px-5 py-4">{user.scansUsed}/{user.monthlyScanLimit}</td>
                    <td className="px-5 py-4 text-[#A3A3A3]">{formatDate(user.latestActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-semibold">OAuth / API 저장 실패 로그</h2>
            <div className="mt-4 space-y-3">
              {overview.operations.recentFailures.length === 0 ? (
                <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-[#A3A3A3]">최근 실패성 product event가 없습니다. OAuth provider 로그는 Supabase/Google 콘솔도 함께 봐야 합니다.</p>
              ) : overview.operations.recentFailures.map((event) => (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4" key={event.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{event.eventName}</p>
                    <span className="text-xs text-[#A3A3A3]">{formatDate(event.occurredAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#A3A3A3]">{event.path} · {event.userId ? shortId(event.userId) : "anonymous"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">QA/test 데이터 정리</h2>
                <p className="mt-1 text-sm leading-6 text-[#A3A3A3]">`qa`, `test`, `테스트` 마커가 있는 카드와 선반 후보만 정리합니다.</p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-4 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45"
                disabled={cleanupBusy || overview.qaCandidates.length === 0}
                onClick={() => void cleanupQaData()}
                type="button"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                정리
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {overview.qaCandidates.length === 0 ? (
                <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-[#A3A3A3]">정리 후보가 없습니다.</p>
              ) : overview.qaCandidates.map((candidate) => (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4" key={`${candidate.type}-${candidate.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{candidate.label}</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-[#A3A3A3]">{candidate.type}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#A3A3A3]">{shortId(candidate.userId)} · {formatDate(candidate.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
