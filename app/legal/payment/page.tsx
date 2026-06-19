import LegalDocument from "@/components/legal-document";

export default function PaymentNoticePage() {
  return (
    <LegalDocument
      title="결제 및 환불 고지"
      updatedAt="2026년 6월 15일"
      summary="CoffeeDex의 유료 기능은 Stripe Checkout을 통해 결제되며, 결제 전 상품명·금액·구독 여부를 다시 확인할 수 있습니다."
      sections={[
        {
          title: "가격",
          body: [
            "Premium 구독은 월 $3.99, 스캔 10팩은 $4.99, PDF 기록북은 $9.99입니다.",
            "세금, 카드사 수수료, 환율 적용 금액은 Stripe 결제 화면 또는 카드사 청구 내역에 따라 달라질 수 있습니다.",
          ],
        },
        {
          title: "구독 취소",
          body: [
            "Premium 구독은 고객지원 요청을 통해 취소할 수 있으며, 취소 후에도 이미 결제된 기간이 끝날 때까지 유료 기능을 사용할 수 있습니다.",
            "결제 실패 또는 미납 상태가 지속되면 Premium 권한이 제한될 수 있습니다.",
          ],
        },
        {
          title: "환불",
          body: [
            "중복 결제, 명백한 오결제, 접근 불가 문제는 고객지원에서 결제 기록을 확인한 뒤 환불 가능 여부를 안내합니다.",
            "이미 생성·다운로드된 디지털 PDF와 사용된 스캔 크레딧은 환불이 제한될 수 있습니다.",
          ],
        },
        {
          title: "지원",
          body: [
            "결제 실패, 구독 취소, 환불 요청은 고객지원 페이지에서 이메일과 문의 내용을 남겨 접수할 수 있습니다.",
          ],
        },
      ]}
    />
  );
}
