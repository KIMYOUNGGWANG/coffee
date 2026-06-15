"use client";

import React from "react";
import { Coffee, Trash2, Calendar, MapPin, Thermometer, Share2 } from "lucide-react";
import { TastingCardData } from "@/hooks/useTastingCards";

interface TastingCardProps {
  card: TastingCardData;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onSelect?: (card: TastingCardData) => void;
  onShare?: (card: TastingCardData) => void;
}

export default function TastingCard({
  card,
  onDelete,
  isDeleting = false,
  onSelect,
  onShare,
}: TastingCardProps) {
  // Safe parsing for nested properties
  const footerMeta = card.footer_meta || {};
  const badges = card.badges || [];
  const tags = card.tags || [];

  // Helper to render metric dots/gauge
  const renderMetricGauge = (value: number, label: string) => {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-espresso/60 font-medium">{label}</span>
          <span className="font-semibold text-espresso">{value} / 5</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                index <= value ? "bg-caramel" : "bg-warm-gray"
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelect && onSelect(card)}
      className="relative aspect-[4/5] w-full max-w-[420px] bg-cream border border-warm-gray rounded-3xl p-6 shadow-sm hover:shadow-[0_20px_50px_rgba(25,20,15,0.06)] hover:-translate-y-2 hover:border-caramel/30 transition-all duration-300 ease-out flex flex-col justify-between overflow-hidden group select-none text-espresso cursor-pointer"
    >
      {/* Decorative Top Accent line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-caramel/20 group-hover:bg-caramel transition-colors duration-300" />

      {/* Card Header */}
      <div className="flex justify-between items-center border-b border-warm-gray pb-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-espresso/50">
          Hyangmi | #{card.id.slice(0, 4).toUpperCase()}
        </span>
        <div className="flex items-center gap-1.5">
          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(card);
              }}
              className="p-1.5 rounded-full hover:bg-warm-gray/30 text-espresso/45 hover:text-caramel transition-colors"
              title="인스타그램 스토리 공유"
            >
              <Share2 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              disabled={isDeleting}
              className="p-1.5 rounded-full hover:bg-red-50 text-espresso/40 hover:text-red-500 transition-colors duration-200"
              title="카드 삭제"
            >
              <Trash2 size={15} className={isDeleting ? "animate-pulse" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-12 gap-4 my-auto items-stretch py-2">
        {/* Left Column: Image with high-end frame */}
        <div className="col-span-5 flex items-center justify-center">
          <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/50 border border-warm-gray shadow-inner flex flex-col items-center justify-center relative group-hover:scale-102 transition-transform duration-300">
            {card.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.image_url}
                alt={card.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-espresso/20">
                <Coffee size={32} strokeWidth={1.5} />
                <span className="text-[10px] tracking-tight">Bean Photo</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tasting details */}
        <div className="col-span-7 flex flex-col justify-between py-1 gap-3">
          <div>
            {badges.length > 0 && (
              <span className="text-[10px] uppercase font-bold text-caramel tracking-wider bg-caramel/10 px-2 py-0.5 rounded-full">
                {badges[0]}
              </span>
            )}
            <h3 className="font-serif text-lg leading-tight font-bold mt-1 text-ellipsis overflow-hidden whitespace-nowrap">
              {card.title}
            </h3>
            <p className="text-xs text-espresso/60 font-medium leading-none mt-0.5 text-ellipsis overflow-hidden whitespace-nowrap">
              {card.subtitle}
            </p>
          </div>

          {/* Gauges */}
          <div className="flex flex-col gap-2">
            {renderMetricGauge(card.metric1, "산미 (Acidity)")}
            {renderMetricGauge(card.metric2, "단맛 (Sweetness)")}
            {renderMetricGauge(card.metric3, "바디 (Body)")}
          </div>

          {/* Method Tag */}
          <div className="flex flex-wrap gap-1 mt-1">
            {badges.slice(1, 3).map((badge, idx) => (
              <span
                key={idx}
                className="text-[9px] font-semibold text-espresso/70 bg-warm-gray/40 border border-warm-gray/60 px-1.5 py-0.5 rounded"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Cup Note Summary Card */}
      <div className="bg-white/40 border border-warm-gray/40 backdrop-blur-sm rounded-2xl p-3 shadow-inner my-2 flex items-start gap-2 min-h-[56px] text-xs leading-relaxed italic text-espresso/80">
        <span className="text-lg leading-none text-caramel/40 select-none">“</span>
        <p className="text-[11px] font-serif pr-2">
          {card.ai_description || "느껴지는 아로마 노트를 기록하고 AI 감성 한줄평을 생성해보세요."}
        </p>
      </div>

      {/* Footer Info */}
      <div className="border-t border-warm-gray pt-2.5 flex justify-between items-center text-[10px] text-espresso/50 font-medium">
        <div className="flex items-center gap-1">
          <Calendar size={11} />
          <span>{footerMeta.date || card.created_at.slice(0, 10).replace(/-/g, ".")}</span>
        </div>
        {footerMeta.origin && (
          <div className="flex items-center gap-1 max-w-[80px] truncate">
            <MapPin size={11} />
            <span className="truncate">{footerMeta.origin}</span>
          </div>
        )}
        {footerMeta.extraInfo && (
          <div className="flex items-center gap-1">
            <Thermometer size={11} />
            <span>{footerMeta.extraInfo.split(",")[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
