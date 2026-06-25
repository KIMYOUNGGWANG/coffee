import { createServerSupabase } from "@/lib/supabase/server";
import PublicFeedCard from "@/components/PublicFeedCard";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { Search, Compass } from "lucide-react";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function FeedPage() {
  const supabase = await createServerSupabase();
  
  // Fetch public cards directly from Supabase
  const { data: cards, error } = await supabase
    .from("tasting_cards")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="coffee-app-shell animate-in fade-in duration-500">
      <header className="mb-8 mt-4 pt-safe">
        <div className="flex items-center gap-3 mb-2">
          <Compass size={28} className="text-primary-amber" />
          <h1 className="font-serif text-3xl font-black tracking-tight text-foreground">Community Feed</h1>
        </div>
        <p className="text-sm text-muted-foreground">Discover brewing recipes and tasting notes from the CoffeeDex community.</p>
        
        <div className="mt-6 relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search beans, roasters, or flavors..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary-amber transition-colors text-foreground"
          />
        </div>
      </header>

      {error ? (
        <div className="text-center py-10 text-red-400">Failed to load feed. Please try again later.</div>
      ) : !cards || cards.length === 0 ? (
        <div className="text-center py-20">
          <Compass size={40} className="mx-auto text-white/20 mb-4" />
          <h2 className="text-lg font-bold text-foreground">No public memories yet</h2>
          <p className="text-sm text-muted-foreground mt-2">Be the first to share your coffee journey!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card: TastingCardData) => (
            <PublicFeedCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </main>
  );
}
