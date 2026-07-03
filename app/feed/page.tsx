import { createServerSupabase } from "@/lib/supabase/server";
import PublicFeedCard from "@/components/PublicFeedCard";
import type { PublicFeedCardData } from "@/components/PublicFeedCard";
import { Search, Compass, ShieldCheck } from "lucide-react";
import { FigmaDashboardShell } from "@/components/figma-dashboard-shell";

export const revalidate = 60; // ISR cache for 60 seconds

const publicFeedTimeoutMs = 800;

type PublicFeedQueryResult = {
  readonly data: PublicFeedCardData[] | null;
  readonly error: { readonly message?: string } | null;
};

function publicFeedTimeout(): Promise<PublicFeedQueryResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: null,
        error: { message: "Public feed request timed out." },
      });
    }, publicFeedTimeoutMs);
  });
}

export default async function FeedPage() {
  const supabase = await createServerSupabase();
  
  const feedQuery = supabase
    .from("tasting_cards")
    .select(`
      id,
      title,
      subtitle,
      metric1,
      metric2,
      metric3,
      tags,
      ai_description,
      footer_meta,
      package_origin,
      created_at
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: cards, error } = await Promise.race([
    feedQuery,
    publicFeedTimeout(),
  ]) as PublicFeedQueryResult;

  return (
    <FigmaDashboardShell
      activeHref="/dashboard"
      actions={<Compass aria-hidden="true" className="text-primary-amber" size={22} />}
      description="커뮤니티 기능은 아직 현재 제품 기능이 아닙니다. 지금은 사용자가 직접 공개한 카드만 확인하는 보조 화면입니다."
      eyebrow="Public preview"
      title="공개 공유 미리보기"
    >
      <div className="mb-5 dashboard-panel p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            aria-label="공개 공유 카드 검색"
            placeholder="원두, 로스터, 향미 검색"
            className="min-h-12 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm font-semibold text-foreground transition-colors focus:outline-none focus:border-primary-amber"
          />
        </div>
      </div>

      {error ? (
        <section
          aria-live="polite"
          className="dashboard-panel px-5 py-12 text-center"
        >
          <ShieldCheck size={34} className="mx-auto text-primary-amber/80" />
          <h2 className="mt-4 break-keep font-serif text-xl font-black text-foreground">
            공개 공유 카드를 잠시 불러오지 못했어요
          </h2>
          <p className="mx-auto mt-3 max-w-md break-keep text-sm font-semibold leading-6 text-muted-foreground">
            내 비공개 기록과 원두 서랍에는 영향이 없습니다. 공개 공유 미리보기는 연결이 회복되면 다시 확인할 수 있어요.
          </p>
        </section>
      ) : !cards || cards.length === 0 ? (
        <section className="dashboard-panel px-5 py-16 text-center">
          <Compass size={40} className="mx-auto mb-4 text-primary-amber/50" />
          <h2 className="text-lg font-bold text-foreground">아직 공개 공유 카드가 없어요</h2>
          <p className="text-sm text-muted-foreground mt-2">현재 CoffeeDex의 기본 기록은 개인 보관과 다시 찾기에 맞춰져 있습니다.</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(cards as PublicFeedCardData[]).map((card) => (
            <PublicFeedCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </FigmaDashboardShell>
  );
}
