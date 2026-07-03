import { createServerSupabase } from "@/lib/supabase/server";
import PublicFeedCard from "@/components/PublicFeedCard";
import type { PublicFeedCardData } from "@/components/PublicFeedCard";
import { Search, Compass, ShieldCheck } from "lucide-react";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function FeedPage() {
  const supabase = await createServerSupabase();
  
  const { data: cards, error } = await supabase
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

  return (
    <main className="coffee-app-shell animate-in fade-in duration-500">
      <header className="mb-8 mt-4 pt-safe">
        <div className="flex items-center gap-3 mb-2">
          <Compass size={28} className="text-primary-amber" />
          <h1 className="font-serif text-3xl font-black tracking-tight text-foreground">공개 공유 미리보기</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          커뮤니티 기능은 아직 현재 제품 기능이 아닙니다. CoffeeDex community is not a current product capability; 지금은 사용자가 직접 공개한 카드만 확인하는 보조 화면입니다.
        </p>
        
        <div className="mt-6 relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="원두, 로스터, 향미 검색"
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-amber transition-colors text-foreground"
          />
        </div>
      </header>

      {error ? (
        <section
          aria-live="polite"
          className="rounded-3xl border border-white/10 bg-white/5 px-5 py-12 text-center shadow-sm"
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
        <section className="rounded-3xl border border-white/10 bg-white/5 px-5 py-16 text-center shadow-sm">
          <Compass size={40} className="mx-auto text-white/20 mb-4" />
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
    </main>
  );
}
