import Link from "next/link";
import { Coffee } from "lucide-react";
import { FigmaDashboardShell } from "@/components/figma-dashboard-shell";
import { coffeeDexBrand } from "@/lib/brand";

type LegalSection = {
  readonly title: string;
  readonly body: readonly string[];
};

type LegalDocumentProps = {
  readonly title: string;
  readonly updatedAt: string;
  readonly summary: string;
  readonly sections: readonly LegalSection[];
};

export default function LegalDocument({ title, updatedAt, summary, sections }: LegalDocumentProps) {
  return (
    <FigmaDashboardShell
      activeHref="/support/billing"
      compact
      description={summary}
      eyebrow="Legal notice"
      title={title}
    >
      <article className="dashboard-panel mx-auto max-w-3xl p-6 md:p-9">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary-amber">
          <Coffee size={14} />
          {coffeeDexBrand.name}
        </Link>
        <header className="mt-5 border-b border-[var(--border)] pb-5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-amber">Document</p>
          <h2 className="mt-2 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-xs font-bold text-muted-foreground">시행일: {updatedAt}</p>
        </header>

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-base font-bold">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-[var(--border)] pt-5 text-xs font-bold text-primary-amber">
          <Link href="/legal/terms">이용약관</Link>
          <Link href="/legal/privacy">개인정보 처리방침</Link>
          <Link href="/legal/payment">결제 및 환불 고지</Link>
          <Link href="/support/billing">고객지원</Link>
        </footer>
      </article>
    </FigmaDashboardShell>
  );
}
