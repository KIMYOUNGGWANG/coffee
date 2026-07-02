import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import type { LaunchHealth, LaunchHealthStatus } from "@/lib/admin-launch-health";

function statusClasses(status: LaunchHealthStatus): string {
  switch (status) {
    case "p0":
      return "border-red-400/40 bg-red-500/15 text-red-100";
    case "p1":
      return "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#FFF8D6]";
    case "ok":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
}

function statusIcon(status: LaunchHealthStatus) {
  switch (status) {
    case "p0":
      return <ShieldAlert className="h-6 w-6" aria-hidden="true" />;
    case "p1":
      return <AlertTriangle className="h-6 w-6" aria-hidden="true" />;
    case "ok":
      return <CheckCircle2 className="h-6 w-6" aria-hidden="true" />;
  }
}

function formatDate(value: string | null): string {
  if (!value) return "없음";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminLaunchHealthPanel({ health }: { readonly health: LaunchHealth }) {
  return (
    <section className={`mt-6 rounded-[30px] border p-5 shadow-[0_22px_80px_rgba(0,0,0,0.32)] ${statusClasses(health.status)}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/25">
            {statusIcon(health.status)}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">Launch Health</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{health.label}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 opacity-80">
              최근 24시간 실패 {health.summary.failures24h}건, 7일 실패 {health.summary.failures7d}건입니다.
              QA/test 이벤트 {health.summary.qaExcludedEvents}건은 운영 지표에서 제외했습니다.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm lg:min-w-[300px]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs opacity-70">P0</p>
            <p className="mt-1 text-2xl font-semibold">{health.summary.p0Count}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs opacity-70">P1</p>
            <p className="mt-1 text-2xl font-semibold">{health.summary.p1Count}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs opacity-70">24h</p>
            <p className="mt-1 text-2xl font-semibold">{health.summary.failures24h}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {health.metrics.map((metric) => (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4" key={metric.key}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{metric.label}</p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusClasses(metric.status)}`}>
                {metric.status}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 opacity-75">{metric.helper}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-sm">24h <b className="text-lg">{metric.failures24h}</b></p>
              <p className="text-sm">7d <b className="text-lg">{metric.failures7d}</b></p>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs opacity-70">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              마지막 {formatDate(metric.lastFailureAt)}
            </p>
          </div>
        ))}
      </div>

      {health.incidents.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">최근 인시던트</h3>
            <span className="text-xs opacity-70">최대 20건</span>
          </div>
          <div className="mt-3 grid gap-2">
            {health.incidents.slice(0, 6).map((incident) => (
              <div className="flex flex-col gap-1 rounded-xl bg-white/[0.055] p-3 text-sm sm:flex-row sm:items-center sm:justify-between" key={`${incident.source}-${incident.id}`}>
                <span className="font-semibold">{incident.category} · {incident.label}</span>
                <span className="text-xs opacity-70">{formatDate(incident.occurredAt)} {incident.path ? `· ${incident.path}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
