import BillingSupportForm from "@/components/billing-support-form";

export default function BillingSupportPage() {
  return (
    <main className="min-h-screen bg-[#0D0A07] p-4 text-foreground md:p-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm backdrop-blur-md">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-amber">Billing support</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">결제·구독 고객지원</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            결제 실패, 구독 취소, 환불 요청, 계정 접근 문제를 한 곳에서 접수합니다. 운영 로그에는 접수번호와 문의 유형만 구조화해 남깁니다.
          </p>
          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <p className="rounded-2xl border border-white/10 bg-white/5/50 p-4">
              결제 실패: 대시보드의 결제 복구 버튼으로 다시 시도하거나 문의를 남겨주세요.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5/50 p-4">
              구독 취소: 현재 결제 기간 종료 전까지 Premium 기능은 유지됩니다.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5/50 p-4">
              환불 요청: 중복 결제, 접근 불가, 오결제 여부를 확인한 뒤 안내합니다.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5/50 p-4">
              Stripe ID가 있으면 영업일 1일 내 확인하고, 없으면 이메일과 문의 내용으로 먼저 조회합니다.
            </p>
          </div>
        </section>
        <BillingSupportForm />
      </div>
    </main>
  );
}
