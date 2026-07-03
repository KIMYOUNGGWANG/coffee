import { BookOpen, Star } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";

export type PublicFeedCardData = Pick<
  TastingCardData,
  | "id"
  | "title"
  | "subtitle"
  | "metric1"
  | "metric2"
  | "metric3"
  | "tags"
  | "ai_description"
  | "footer_meta"
  | "package_origin"
>;

type PublicFeedCardProps = {
  card: PublicFeedCardData;
};

export default function PublicFeedCard({ card }: PublicFeedCardProps) {
  const origin = card.package_origin || card.footer_meta?.origin || "원산지 미기록";
  const rating = ((card.metric1 + card.metric2 + card.metric3) / 3).toFixed(1);

  return (
    <article className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg p-5 flex flex-col gap-3 transition-transform hover:scale-[1.02]">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-primary-amber uppercase tracking-widest">{origin}</span>
          <h3 className="font-serif text-lg font-black leading-tight text-foreground mt-1">{card.title}</h3>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">{card.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10">
          <Star size={12} className="text-primary-amber" fill="currentColor" />
          <span className="text-xs font-bold text-primary-amber">{rating}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1">
        {card.tags.slice(0, 4).map(tag => (
          <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>

      <div className="bg-black/30 rounded-xl p-3 border border-white/5 mt-2">
        <p className="text-xs text-foreground/80 leading-relaxed italic line-clamp-3">
          "{card.ai_description || "사용자가 확인해 공개한 커피 기억입니다."}"
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <BookOpen size={12} />
          공개된 향미 단서
        </div>
        <div className="font-bold text-primary-amber/80">내 기록에 참고</div>
      </div>
    </article>
  );
}
