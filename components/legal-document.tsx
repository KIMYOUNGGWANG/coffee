import Link from "next/link";
import { Coffee } from "lucide-react";
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
    <main className="min-h-screen bg-[#0D0A07] p-4 text-foreground md:p-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/80 p-6 shadow-sm backdrop-blur-md md:p-9">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary-amber">
          <Coffee size={14} />
          {coffeeDexBrand.name}
        </Link>
        <header className="mt-5 border-b border-white/10 pb-5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-amber">Legal notice</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-xs font-bold text-muted-foreground/60">시행일: {updatedAt}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{summary}</p>
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

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-5 text-xs font-bold text-primary-amber">
          <Link href="/legal/terms">이용약관</Link>
          <Link href="/legal/privacy">개인정보 처리방침</Link>
          <Link href="/legal/payment">결제 및 환불 고지</Link>
          <Link href="/support/billing">고객지원</Link>
        </footer>
      </article>
    </main>
  );
}
