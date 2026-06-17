"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { tasteProfilePresets, type TasteProfileKey } from "@/lib/taste-profile";

type OnboardingTasteFinderProps = {
  readonly dashboardHref: string;
};

function hrefWithTasteProfile(href: string, tasteProfile: TasteProfileKey | null): string {
  if (!tasteProfile) return href;

  const url = new URL(href, "https://hyangmi.local");
  url.searchParams.set("taste_profile", tasteProfile);
  const search = url.searchParams.toString();
  return search ? `${url.pathname}?${search}` : url.pathname;
}

export default function OnboardingTasteFinder({ dashboardHref }: OnboardingTasteFinderProps) {
  const [selectedTasteProfile, setSelectedTasteProfile] = useState<TasteProfileKey | null>(null);
  const selectedPreset = selectedTasteProfile ? tasteProfilePresets.find((preset) => preset.key === selectedTasteProfile) : null;
  const activationHref = useMemo(
    () => hrefWithTasteProfile(dashboardHref, selectedTasteProfile),
    [dashboardHref, selectedTasteProfile],
  );

  return (
    <div className="grid gap-5">
      <div className="border border-espresso bg-[#fffaf0] p-5 shadow-[8px_8px_0_rgba(47,37,31,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9f6a4a]">
              Taste profile cards
            </p>
            <h2 className="mt-3 break-keep font-serif text-3xl font-black leading-tight">
              커피 추천은 첫 기록에서 시작됩니다.
            </h2>
          </div>
          <span className="grid size-11 shrink-0 place-items-center border border-espresso/15 text-[#9f6a4a]">
            <BookOpen size={18} />
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3" role="group" aria-label="Taste Finder profile">
          {tasteProfilePresets.map((profile) => {
            const isSelected = selectedTasteProfile === profile.key;
            return (
              <button
                key={profile.key}
                type="button"
                aria-pressed={isSelected}
                data-testid={`taste-profile-${profile.key}`}
                onClick={() => setSelectedTasteProfile(profile.key)}
                className={`group min-h-[168px] border p-4 text-left transition ${
                  isSelected
                    ? "border-espresso bg-[#ead6bc] text-espresso shadow-[5px_5px_0_rgba(47,37,31,0.16)]"
                    : "border-espresso/15 bg-[#f6efe3] text-espresso hover:-translate-y-0.5 hover:border-espresso/45"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-serif text-lg font-black leading-tight">{profile.label}</span>
                  {isSelected && (
                    <span className="inline-flex shrink-0 items-center gap-1 border border-espresso/25 bg-[#fffaf0] px-2 py-1 text-[10px] font-black text-[#7b4d34]">
                      <Check size={14} />
                      선택됨
                    </span>
                  )}
                </span>
                <span className={`mt-2 block text-xs font-bold leading-5 ${isSelected ? "text-espresso/72" : "text-espresso/58"}`}>
                  {profile.notes}
                </span>
                <span
                  className={`mt-5 block border-t pt-3 text-[11px] font-black uppercase tracking-[0.16em] ${
                    isSelected ? "border-espresso/18 text-[#7b4d34]" : "border-espresso/15 text-[#9f6a4a]"
                  }`}
                >
                  {profile.score}
                </span>
                <span className={`mt-2 block text-[11px] font-extrabold leading-5 ${isSelected ? "text-espresso/64" : "text-espresso/46"}`}>
                  {profile.metricPreview}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border border-espresso/12 bg-[#fcf7ea] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7b4d34]">
            {selectedPreset ? "Taste Finder 선택됨" : "Taste Finder 준비"}
          </p>
          <p className="mt-2 break-keep text-sm font-extrabold leading-6 text-espresso/72" data-testid="taste-profile-selection-copy">
            {selectedPreset
              ? `${selectedPreset.label}: ${selectedPreset.cue}`
              : "프로필을 고르면 첫 Taste Card의 산미, 단맛, 바디와 향미 태그가 미리 채워집니다."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={activationHref}
          data-testid="onboarding-first-card-cta"
          className="inline-flex h-12 items-center justify-center gap-2 border border-espresso bg-espresso px-6 text-sm font-black text-white shadow-[5px_5px_0_rgba(47,37,31,0.16)] transition hover:-translate-y-0.5 hover:bg-espresso"
        >
          첫 Taste Card 시작하기
          <ArrowRight size={15} />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center gap-2 border border-espresso/20 bg-transparent px-6 text-sm font-black text-espresso transition hover:-translate-y-0.5 hover:bg-[#f2eadb]"
        >
          샘플 Hyangmi 기록 보기
        </Link>
      </div>
    </div>
  );
}
