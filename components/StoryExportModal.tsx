"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Link2Off, Loader2, Share2, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { coffeeDexBrand } from "@/lib/brand";
import {
  STORY_SKIN_KEYS,
  STORY_SKINS,
  createStoryFilename,
  storySvg,
  type SkinType,
} from "@/components/story-export-assets";
import { FlavorRadarChart } from "@/components/flavor-radar-chart";

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
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(card.is_public === true);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const copyResetTimerRef = useRef<number | null>(null);
  const { trackEvent } = useAnalyticsEvents();

  useEffect(() => {
    if (isOpen) {
      trackEvent("story_share_started", { cardId: card.id });
    }
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, [isOpen, card.id, trackEvent]);

  if (!isOpen) return null;

  const skin = STORY_SKINS[activeSkin];
  const dateText = card.footer_meta?.date || card.created_at.slice(0, 10).replace(/-/g, ".");
  const originText = card.footer_meta?.origin || "Unknown Origin";
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
    setShareNotice(null);
    try {
      const response = await fetch(`/api/v1/cards/${card.id}/share`, { method: "POST" });
      const parsedResponse = shareResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsedResponse.success) {
        setShareError("공개 링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      const nextPublicUrl = parsedResponse.data.data.publicUrl;
      setIsPublic(true);
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

  const handleRevokePublicLink = async () => {
    setIsPublishing(true);
    setShareError(null);
    setShareNotice(null);
    try {
      const response = await fetch(`/api/v1/cards/${card.id}/share`, { method: "DELETE" });
      if (!response.ok) {
        setShareError("공개 링크를 해제하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setIsPublic(false);
      setPublicUrl(null);
      setCopied(false);
      setShareNotice("공개 링크가 해제되었습니다.");
    } catch (error: unknown) {
      setShareError(error instanceof Error ? error.message : "공개 링크를 해제하지 못했습니다.");
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
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-export-title"
            className="glass-card border border-white/10 rounded-[24px] w-full max-w-4xl shadow-2xl h-[90vh] md:h-[680px] flex flex-col md:flex-row overflow-hidden text-foreground bg-black/60 backdrop-blur-2xl"
          >
        <div className="flex-1 bg-black/40 p-4 flex items-center justify-center relative overflow-hidden border-r border-white/10">
          <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-muted-foreground border border-white/10">
            9:16 Story Card Live Preview
          </div>
          <div id="story-container" className={`w-[270px] h-[480px] rounded-[24px] ${skin.bg} relative p-6 flex flex-col justify-between shadow-2xl overflow-hidden select-none animate-in fade-in duration-300`}>
            <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-primary-amber/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-primary-amber/10 blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center z-10">
              <span className={`text-[8px] uppercase tracking-widest font-extrabold ${skin.subColor}`}>CoffeeDex Archive</span>
              <span className={`text-[8px] font-semibold ${skin.textColor}/40`}>{dateText}</span>
            </div>
            <div className={`rounded-2xl border ${skin.cardBg} p-4 mt-4 flex flex-col gap-4 z-10`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[8px] uppercase font-extrabold px-2 py-1 rounded-md ${skin.accentBg}`}>{card.badges?.[0] || "Single Origin"}</span>
                  <h3 className={`font-serif text-base font-extrabold mt-2 leading-none ${skin.textColor}`}>{card.title}</h3>
                  <p className={`text-[10px] font-medium mt-2 leading-none ${skin.textColor}/60`}>{card.subtitle}</p>
                </div>
                {card.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.image_url} alt={card.title} className="w-10 h-10 object-cover rounded-xl border border-white/10" />
                )}
              </div>
              <div className="flex justify-center -my-2 opacity-90 scale-90">
                <FlavorRadarChart
                  metric1={card.metric1}
                  metric2={card.metric2}
                  metric3={card.metric3}
                  metric4={card.metric4 ?? 3}
                  metric5={card.metric5 ?? 3}
                  metric6={card.metric6 ?? 3}
                  className="w-[140px] h-[140px]"
                />
              </div>
              <div className={`flex flex-wrap gap-2 border-t ${skin.divider} pt-2`}>
                {card.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={`text-[8px] font-bold px-2 py-1 rounded-full ${skin.badgeBg}`}>#{tag}</span>
                ))}
              </div>
              <div className={`border-t ${skin.divider} pt-2`}>
                <p className={`text-[9px] italic font-serif leading-relaxed ${skin.textColor}/80`}>“{card.ai_description || "조화롭고 밸런스가 돋보이는 컵."}”</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 pb-2">
              <span className={`text-[8px] font-medium tracking-wider ${skin.textColor}/60`}>Origin: {originText}</span>
              <div className={`h-[1px] w-8 ${skin.divider}`} />
              <div className="flex items-center gap-2 mt-2">
                <Sparkles size={8} className="text-primary-amber animate-pulse" />
                <span className="text-[7px] uppercase font-bold tracking-widest text-white/50">Shared via {coffeeDexBrand.name}</span>
              </div>
            </div>
          </div>
        </div>
          <div className="w-full md:w-5/12 p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 id="story-export-title" className="font-serif font-bold text-lg">인스타그램 스토리 공유</h3>
                <p className="text-xs text-muted-foreground mt-2">상세 기록에서 카드 이미지를 받거나 CoffeeDex 공개 링크를 관리합니다.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-muted-foreground transition-colors" aria-label="닫기">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 mt-8">
              <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider block">디자인 테마 스킨</span>
              <div className="grid grid-cols-2 gap-4">
                {STORY_SKIN_KEYS.map((key) => (
                  <button key={key} onClick={() => setActiveSkin(key)} className={`p-4 rounded-2xl border text-xs font-bold transition-all text-left flex flex-col justify-between h-20 ${activeSkin === key ? "border-primary-amber bg-white/10 shadow-sm" : "border-white/10 bg-black/40/5 hover:bg-white/10"}`}>
                    <span className="text-[10px] text-muted-foreground">{STORY_SKINS[key].name}</span>
                    <div className="flex gap-2 mt-2">
                      <div className="w-4 h-4 rounded-full bg-primary-amber border border-white" />
                      <div className={`w-4 h-4 rounded-full ${STORY_SKINS[key].swatch} border border-white`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-primary-amber flex items-center gap-2 text-[11px]">
                <Share2 size={16} />
                성장 루프
              </span>
              <ul className="list-disc pl-4 space-y-2 text-[11px] text-foreground/80">
                <li>이미지는 스토리에 올리고, 공개 링크는 링크 스티커나 프로필에 붙이세요.</li>
                <li>공개 페이지에는 카드 정보만 표시되고 사용자 계정 정보는 노출하지 않습니다.</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 space-y-4 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-4">
              <button onClick={handleCopyPublicLink} disabled={isPublishing} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-foreground rounded-xl text-xs font-bold transition-all border border-white/10 disabled:opacity-60">
                {isPublishing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : copied ? (
                  <>
                    <Check size={16} className="text-primary-amber" />
                    <span>공개 링크 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span>공개 카드 링크 복사</span>
                  </>
                )}
              </button>
              
              <button onClick={async () => {
                setIsPublishing(true);
                try {
                  const response = await fetch(`/api/v1/cards/${card.id}/share`, { method: "POST" });
                  const parsed = shareResponseSchema.safeParse(await response.json());
                  if (response.ok && parsed.success) {
                    const token = parsed.data.data.publicShareToken;
                    const quizUrl = `${window.location.origin}/quiz/${token}`;
                    await navigator.clipboard.writeText(quizUrl);
                    markCopied();
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsPublishing(false);
                }
              }} disabled={isPublishing} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-amber/10 hover:bg-primary-amber/20 text-primary-amber rounded-xl text-xs font-bold transition-all border border-primary-amber/30 disabled:opacity-60">
                <Sparkles size={16} />
                <span>블라인드 퀴즈 링크 복사</span>
              </button>
            </div>

            {publicUrl && (
              <p className="break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground mt-2">
                {publicUrl}
              </p>
            )}
            {isPublic && (
              <button onClick={handleRevokePublicLink} disabled={isPublishing} className="w-full flex items-center justify-center gap-2 py-2 text-muted-foreground hover:text-foreground rounded-xl text-[11px] font-semibold transition-colors disabled:opacity-60">
                <Link2Off size={16} />
                <span>공개 링크 해제</span>
              </button>
            )}
            <button onClick={handleDownloadStory} className="w-full flex items-center justify-center gap-2 py-4 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold transition-all shadow-[0_8px_24px_rgba(217,119,6,0.25)] mt-4">
              <Download size={16} />
              <span>Story 이미지 다운로드</span>
            </button>
            {shareError && <p role="alert" className="text-[11px] leading-relaxed text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{shareError}</p>}
            {shareNotice && <p role="status" className="text-[11px] leading-relaxed text-muted-foreground px-3 py-2">{shareNotice}</p>}
            {downloadError && <p role="alert" className="text-[11px] leading-relaxed text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{downloadError}</p>}
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
