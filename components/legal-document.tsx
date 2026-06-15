import Link from "next/link";
import { Coffee } from "lucide-react";
import { hyangmiBrand } from "@/lib/brand";

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
    <main className="min-h-screen bg-[#f7f7f4] p-4 text-espresso md:p-10">
      <article className="mx-auto max-w-3xl rounded-3xl border border-warm-gray bg-white/80 p-6 shadow-sm backdrop-blur-md md:p-9">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-caramel">
          <Coffee size={14} />
          {hyangmiBrand.name}
        </Link>
        <header className="mt-5 border-b border-warm-gray pb-5">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-caramel">Legal notice</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-xs font-bold text-espresso/45">시행일: {updatedAt}</p>
          <p className="mt-4 text-sm leading-relaxed text-espresso/65">{summary}</p>
        </header>

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-base font-bold">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-espresso/65">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-warm-gray pt-5 text-xs font-bold text-caramel">
          <Link href="/legal/terms">이용약관</Link>
          <Link href="/legal/privacy">개인정보 처리방침</Link>
          <Link href="/legal/payment">결제 및 환불 고지</Link>
          <Link href="/support/billing">고객지원</Link>
        </footer>
      </article>
    </main>
  );
}
