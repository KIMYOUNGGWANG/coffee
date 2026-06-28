"use client";

import React, { useRef, useState } from "react";
import { X, Download, Share2, Loader2, AlertCircle } from "lucide-react";
import DNAExportCard, { type DNAExportCardProps } from "./DNAExportCard";

interface DNAExportModalProps extends DNAExportCardProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function DNAExportModal({
  isOpen,
  onClose,
  ...cardProps
}: DNAExportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setIsGenerating(true);
    setError(null);
    try {
      // Dynamic import to prevent next.js build failures if package is not in package.json
      // @ts-ignore
      const htmlToImage = await import("html-to-image");
      
      // Ensure font and images are loaded before capture
      await new Promise((resolve) => setTimeout(resolve, 500));

      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        width: 1080,
        height: 1920,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          width: "1080px",
          height: "1920px",
        },
      });

      const link = document.createElement("a");
      link.download = `coffeedex-dna-${cardProps.userName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      setError("PNG 변환을 사용하려면 'npm install html-to-image' 설치가 필요합니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "나의 커피 DNA",
          text: `CoffeeDex에서 분석한 저의 커피 DNA는 '${cardProps.typeLabel}' 입니다!`,
          url: window.location.origin,
        });
      } catch (err) {
        console.error("Web Share failed:", err);
        // Fallback to download
        await handleDownload();
      }
    } else {
      // Web Share not supported, fallback to download
      await handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Off-screen high-res export target */}
      <div className="pointer-events-none absolute left-[-9999px] top-[-9999px] overflow-hidden">
        <div ref={exportRef}>
          <DNAExportCard {...cardProps} />
        </div>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Story Preview</span>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer border-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scaled-down preview container (1080x1920 scaled to 270x480) */}
        <div className="relative w-[270px] h-[480px] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-inner flex items-start justify-start select-none">
          <div className="scale-[0.25] origin-top-left w-[1080px] h-[1920px]">
            <DNAExportCard {...cardProps} />
          </div>
        </div>

        {/* Actions */}
        <div className="w-full mt-6 space-y-3">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-3 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer border-none"
          >
            {isGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span>스토리 이미지 저장 (PNG)</span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white py-3 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer border-none"
          >
            <Share2 size={14} />
            <span>스토리 공유하기</span>
          </button>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="leading-normal">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
