import Link from "next/link";

export default function LegalFooterLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <Link className="font-bold text-muted-foreground transition-colors hover:text-foreground" href="/dashboard">
        내 대시보드
      </Link>
      <span className="text-white/10">|</span>
      <Link className="font-bold text-muted-foreground transition-colors hover:text-foreground" href="/support/billing">
        고객지원
      </Link>
      <span className="text-white/10">|</span>
      <Link className="font-bold text-muted-foreground transition-colors hover:text-foreground" href="/legal/terms">
        약관
      </Link>
      <Link className="font-bold text-muted-foreground transition-colors hover:text-foreground" href="/legal/privacy">
        개인정보
      </Link>
      <Link className="font-bold text-muted-foreground transition-colors hover:text-foreground" href="/legal/payment">
        결제고지
      </Link>
    </div>
  );
}
