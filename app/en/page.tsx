import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight, Coffee, Layers, Sparkles } from "lucide-react";
import LandingPlaygroundLazy from "@/components/landing-playground-lazy";
import LegalFooterLinks from "@/components/legal-footer-links";
import { LandingSectionViewTracker } from "@/components/landing-analytics-client";
import { buttonVariants } from "@/components/ui/button";
import { coffeeDexBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

const copyrightYear = 2026;

const englishProductOutputs = [
  {
    tag: "Taste Passport",
    title: "Private coffee stamps",
    body: "Save the bean, roaster, origin, process, and cup memory as a personal tasting archive.",
  },
  {
    tag: "Note Draft",
    title: "Package scan drafts",
    body: "Turn a bag photo into editable package claims, then confirm what is true before saving.",
  },
  {
    tag: "Rebuy Memory",
    title: "Buy-again cues",
    body: "Connect why you liked a coffee, what is left on the shelf, and where to find it again.",
  },
  {
    tag: "Story Export",
    title: "Shareable artifacts",
    body: "Export a saved coffee memory as an optional story card after the private record exists.",
  },
] as const;

export default function EnglishCoffeeDexHomePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--background)] p-4 text-foreground selection:bg-primary-amber/20 md:p-10" lang="en">
      <LandingSectionViewTracker eventName="landing_view" />
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="dashboard-panel flex w-full min-w-0 items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-[var(--accent-foreground)] shadow-lg">
              <Coffee size={18} strokeWidth={2} />
            </div>
            <span className="font-serif text-lg font-extrabold tracking-wide">{coffeeDexBrand.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link className="hidden text-sm font-bold tracking-wide text-muted-foreground transition-colors hover:text-foreground md:inline-flex" href="/" hrefLang="ko">
              한국어
            </Link>
            <Link className={cn(buttonVariants({ size: "sm" }), "shrink-0 rounded-full border-none bg-[var(--surface-strong)] px-5 py-4 text-xs font-bold !text-[var(--accent-foreground)] transition-all hover:bg-[#372319]")} href="/capture">
              Start a 20-sec record
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 items-center gap-12 pt-8 lg:grid-cols-12">
          <div className="dashboard-panel animate-in fade-in slide-in-from-bottom-8 space-y-8 p-6 text-left duration-700 md:p-8 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-amber/20 bg-primary-amber/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary-amber shadow-inner">
              <Sparkles size={12} />
              Korea-first specialty coffee memory
            </div>

            <h1 className="max-w-full text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold leading-[1.1] text-foreground">
              Remember coffees worth buying again in{" "}
              <span className="text-primary-amber">20 seconds</span> with {coffeeDexBrand.name}.
            </h1>

            <p className="max-w-xl text-sm font-semibold leading-relaxed text-muted-foreground md:text-lg">
              Before the memory fades, save the bean, roaster, and buy-again cue. CoffeeDex keeps the loop private, does not store raw scan images, and asks you to sign in only when you save.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                className={cn(
                  buttonVariants({ size: "default" }),
                  "flex items-center gap-2 rounded-full border-none bg-[var(--surface-strong)] px-8 py-6 text-sm font-extrabold !text-[var(--accent-foreground)] transition-all hover:-translate-y-1 hover:bg-[#372319]",
                )}
                href="/capture"
              >
                Start a 20-sec record
                <ChevronRight size={18} />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "rounded-full border-[var(--border)] bg-[var(--surface)] px-8 py-6 text-sm font-bold text-foreground transition-all hover:-translate-y-1 hover:bg-[var(--surface-muted)]",
                )}
                href="/onboarding"
              >
                Find my taste direction
              </Link>
            </div>
          </div>

          <div className="perspective-1000 animate-in fade-in slide-in-from-right-8 flex justify-center duration-700 delay-150 lg:col-span-5">
            <div className="relative aspect-[3/4] w-full max-w-[420px] rounded-[2rem] transition-all duration-700 hover:rotate-0" style={{ transform: "rotateY(-10deg) rotateX(5deg) scale(0.95)" }}>
              <div className="absolute inset-0 -z-10 rounded-full bg-primary-amber/20 blur-[80px]" />
              <div className="group relative h-full w-full overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-[#291912]/45 via-transparent to-white/5" />
                <Image
                  src="/images/premium_coffee_brewing.png"
                  alt="Specialty coffee brewing scene for a CoffeeDex memory"
                  width={900}
                  height={1200}
                  priority
                  sizes="(min-width: 1024px) 420px, 92vw"
                  className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <div className="absolute bottom-6 left-6 right-6 z-20 flex translate-y-2 items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-4 shadow-2xl backdrop-blur-xl transition-transform duration-500 group-hover:translate-y-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-amber/20 bg-primary-amber/10 text-primary-amber">
                    <Coffee size={18} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="mb-1 text-[10px] font-bold uppercase leading-none tracking-[0.15em] text-primary-amber">Today's bean</p>
                    <p className="truncate text-sm font-bold text-foreground">Fritz Ethiopia Sidama</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-12 border-t border-[var(--border)] pt-10">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-amber">Current product boundary</span>
            <h2 className="text-3xl font-black text-foreground md:text-4xl">A memory drawer for coffees you loved</h2>
            <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
              CoffeeDex starts with private recall and repurchase. Marketplace, referral, roaster partnerships, and community feeds are future layers, not current product claims.
            </p>
          </div>

          <div className="dashboard-panel relative overflow-hidden p-8 md:p-12">
            <div className="relative z-10 flex flex-col items-start justify-between gap-6 border-b border-[var(--border)] pb-8 md:flex-row">
              <div className="max-w-xl">
                <h2 className="mb-2 text-2xl font-black text-foreground">What CoffeeDex provides today</h2>
                <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                  Free memories begin privately. Premium remains an optional layer for people who scan coffee bags often.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                <BookOpen size={14} />
                Tasting archive
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-6 pt-8 md:grid-cols-4">
              {englishProductOutputs.map((item) => (
                <div key={item.tag} className="flex flex-col space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-amber">/ {item.tag}</span>
                  <div className="h-px w-8 bg-primary-amber/30" />
                  <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs font-semibold leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl py-12">
          <LandingPlaygroundLazy />
        </div>

        <footer className="mt-24 flex w-full flex-col items-center justify-between gap-6 border-t border-[var(--border)] py-8 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2 font-serif">
            <Layers size={14} className="text-primary-amber" />
            <span>CoffeeDex © {copyrightYear}</span>
          </div>
          <LegalFooterLinks />
        </footer>
      </div>
    </main>
  );
}
