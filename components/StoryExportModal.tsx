"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, Share2, Sparkles, X } from "lucide-react";
import { z } from "zod";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { hyangmiBrand } from "@/lib/brand";
import {
  STORY_SKIN_KEYS,
  STORY_SKINS,
  createStoryFilename,
  storySvg,
  type SkinType,
} from "@/components/story-export-assets";

type StoryExportModalProps = {
  readonly card: TastingCardData;
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

const shareResponseSchema = z.object({
  data: z.object({
    publicShareToken: z.string().min(1),
    publicUrl: z.string().url(),
  }),
});

export default function StoryExportModal({ card, isOpen, onClose }: StoryExportModalProps) {
  const [activeSkin, setActiveSkin] = useState<SkinType>("dark");
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const { trackEvent } = useAnalyticsEvents();

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const skin = STORY_SKINS[activeSkin];
  const dateText = card.footer_meta?.date || card.created_at.slice(0, 10).replace(/-/g, ".");
  const originText = card.footer_meta?.origin || "Unknown Origin";
  const metrics = [
    { label: "산미 (Acidity)", value: card.metric1 },
    { label: "단맛 (Sweetness)", value: card.metric2 },
    { label: "바디감 (Body)", value: card.metric3 },
  ] as const;

  const markCopied = () => {
    setCopied(true);
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyResetTimerRef.current = null;
    }, 2000);
  };

  const handleCopyPublicLink = async () => {
    setIsPublishing(true);
    setShareError(null);
    try {
      const response = await fetch(`/api/v1/cards/${card.id}/share`, { method: "POST" });
      const parsedResponse = shareResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsedResponse.success) {
        setShareError("공개 링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      const nextPublicUrl = parsedResponse.data.data.publicUrl;
      setPublicUrl(nextPublicUrl);
      await navigator.clipboard.writeText(nextPublicUrl);
      trackEvent("public_share_link_copied", { cardId: card.id });
      markCopied();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setShareError(`복사 권한이 차단되어 링크를 아래에 표시합니다. ${error.message}`);
        return;
      }
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadStory = () => {
    try {
      const blob = new Blob([storySvg(card, skin, dateText, originText)], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = createStoryFilename(card.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      trackEvent("story_downloaded", { cardId: card.id, skin: activeSkin });
      setDownloadError(null);
    } catch (error: unknown) {
      setDownloadError(error instanceof Error ? error.message : "스토리 이미지를 만들지 못했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-espresso/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-export-title"
        className="bg-white border border-warm-gray rounded-3xl w-full max-w-4xl shadow-2xl h-[90vh] md:h-[680px] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-espresso"
      >
        <div className="flex-1 bg-warm-gray/25 p-4 flex items-center justify-center relative overflow-hidden border-r border-warm-gray">
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-espresso/60 border border-warm-gray">
            9:16 Story Card Live Preview
          </div>
          <div id="story-container" className={`w-[270px] h-[480px] rounded-[24px] ${skin.bg} relative p-6 flex flex-col justify-between shadow-2xl overflow-hidden select-none animate-in fade-in duration-300`}>
            <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-caramel/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-caramel/10 blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center z-10">
              <span className={`text-[8px] uppercase tracking-widest font-extrabold ${skin.subColor}`}>Hyangmi Archive</span>
              <span className={`text-[8px] font-semibold ${skin.textColor}/40`}>{dateText}</span>
            </div>
            <div className={`rounded-2xl border ${skin.cardBg} p-4 mt-2 flex flex-col gap-3.5 z-10`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded-md ${skin.accentBg}`}>{card.badges?.[0] || "Single Origin"}</span>
                  <h3 className={`font-serif text-base font-extrabold mt-1.5 leading-none ${skin.textColor}`}>{card.title}</h3>
                  <p className={`text-[10px] font-medium mt-1 leading-none ${skin.textColor}/60`}>{card.subtitle}</p>
                </div>
                {card.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.image_url} alt={card.title} className="w-10 h-10 object-cover rounded-xl border border-white/10" />
                )}
              </div>
              <div className="space-y-1.5">
                {metrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-[9px] font-medium">
                      <span className={`${skin.textColor}/50`}>{metric.label}</span>
                      <span className={skin.textColor}>{metric.value} / 5</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-caramel" style={{ width: `${(metric.value / 5) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={`flex flex-wrap gap-1 border-t ${skin.divider} pt-2`}>
                {card.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${skin.badgeBg}`}>#{tag}</span>
                ))}
              </div>
              <div className={`border-t ${skin.divider} pt-2`}>
                <p className={`text-[9px] italic font-serif leading-relaxed ${skin.textColor}/80`}>“{card.ai_description || "조화롭고 밸런스가 돋보이는 컵."}”</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 z-10 pb-1">
              <span className={`text-[8px] font-medium tracking-wider ${skin.textColor}/60`}>Origin: {originText}</span>
              <div className={`h-[1px] w-6 ${skin.divider}`} />
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles size={8} className="text-caramel animate-pulse" />
                <span className="text-[7px] uppercase font-bold tracking-widest text-white/50">Shared via {hyangmiBrand.name}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-5/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-warm-gray">
              <div>
                <h3 id="story-export-title" className="font-serif font-bold text-lg">인스타그램 스토리 공유</h3>
                <p className="text-xs text-espresso/50">카드 이미지는 다운로드하고, 공개 링크는 Hyangmi 페이지로 연결됩니다.</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-warm-gray/30 text-espresso/60 transition-colors" aria-label="닫기">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3.5 mt-6">
              <span className="text-xs font-bold text-espresso/65 uppercase tracking-wider block">디자인 테마 스킨</span>
              <div className="grid grid-cols-2 gap-2.5">
                {STORY_SKIN_KEYS.map((key) => (
                  <button key={key} onClick={() => setActiveSkin(key)} className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between h-16 ${activeSkin === key ? "border-caramel bg-cream shadow-sm" : "border-warm-gray bg-[#faf9f6] hover:bg-warm-gray/20"}`}>
                    <span className="text-[10px] text-espresso/60">{STORY_SKINS[key].name}</span>
                    <div className="flex gap-1.5 mt-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-caramel border border-white" />
                      <div className={`w-3.5 h-3.5 rounded-full ${STORY_SKINS[key].swatch} border border-white`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 bg-cream/40 border border-warm-gray rounded-2xl p-4 space-y-2 text-xs text-espresso/70 leading-relaxed">
              <span className="font-bold text-caramel flex items-center gap-1 text-[11px]">
                <Share2 size={13} />
                성장 루프
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-espresso/80">
                <li>이미지는 스토리에 올리고, 공개 링크는 링크 스티커나 프로필에 붙이세요.</li>
                <li>공개 페이지에는 카드 정보만 표시되고 사용자 계정 정보는 노출하지 않습니다.</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 space-y-2 border-t border-warm-gray pt-6">
            <button onClick={handleCopyPublicLink} disabled={isPublishing} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#f5f4f0] hover:bg-warm-gray/35 text-espresso rounded-xl text-xs font-bold transition-all border border-warm-gray disabled:opacity-60">
              {isPublishing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : copied ? (
                <>
                  <Check size={14} className="text-caramel" />
                  <span>공개 링크 복사 완료!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>공개 카드 링크 복사</span>
                </>
              )}
            </button>
            {publicUrl && (
              <p className="break-all rounded-xl border border-warm-gray bg-white px-3 py-2 text-[10px] leading-relaxed text-espresso/55">
                {publicUrl}
              </p>
            )}
            <button onClick={handleDownloadStory} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-espresso hover:bg-espresso/90 text-white rounded-xl text-xs font-bold transition-all shadow-md">
              <Download size={14} />
              <span>Story 이미지 다운로드</span>
            </button>
            {shareError && <p role="alert" className="text-[11px] leading-relaxed text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{shareError}</p>}
            {downloadError && <p role="alert" className="text-[11px] leading-relaxed text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{downloadError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
