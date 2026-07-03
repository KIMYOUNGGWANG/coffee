import BillingSupportForm from "@/components/billing-support-form";
import { FigmaDashboardShell } from "@/components/figma-dashboard-shell";

export default function BillingSupportPage() {
  return (
    <FigmaDashboardShell
      activeHref="/support/billing"
      description="결제 실패, 구독 취소, 환불 요청, 계정 접근 문제를 한 곳에서 접수합니다."
      eyebrow="Billing support"
      title="결제·구독 고객지원"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="dashboard-panel p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-amber">Billing support</p>
          <h2 className="mt-2 text-2xl font-black">접수 전에 확인할 내용</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            운영 로그에는 접수번호와 문의 유형만 구조화해 남깁니다.
          </p>
          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <p className="dashboard-muted-panel p-4">
              결제 실패: 대시보드의 결제 복구 버튼으로 다시 시도하거나 문의를 남겨주세요.
            </p>
            <p className="dashboard-muted-panel p-4">
              구독 취소: 현재 결제 기간 종료 전까지 Premium 기능은 유지됩니다.
            </p>
            <p className="dashboard-muted-panel p-4">
              환불 요청: 중복 결제, 접근 불가, 오결제 여부를 확인한 뒤 안내합니다.
            </p>
            <p className="dashboard-muted-panel p-4">
              Stripe ID가 있으면 영업일 1일 내 확인하고, 없으면 이메일과 문의 내용으로 먼저 조회합니다.
            </p>
          </div>
        </section>
        <BillingSupportForm />
      </div>
    </FigmaDashboardShell>
  );
}
