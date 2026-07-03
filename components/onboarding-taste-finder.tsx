"use client";

import Link from "next/link";
import { ArrowRight, Check, Circle, Citrus, Coffee, Diamond, ScanLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { tasteProfilePresetByKey, type TasteProfileKey } from "@/lib/taste-profile";

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

type TasteProfileDisplay = {
  readonly key: TasteProfileKey;
  readonly title: string;
  readonly subtitle: string;
  readonly icon: LucideIcon;
};

const tasteProfileDisplays: readonly TasteProfileDisplay[] = [
  {
    key: "bright",
    title: "밝은 산미",
    subtitle: "산뜻하고 가벼운 느낌의 커피",
    icon: Citrus,
  },
  {
    key: "sweet",
    title: "달콤한 균형",
    subtitle: "단맛과 산미의 균형이 좋은 커피",
    icon: Diamond,
  },
  {
    key: "balanced",
    title: "묵직한 바디",
    subtitle: "진하고 묵직한 느낌의 커피",
    icon: Coffee,
  },
] as const;

export default function OnboardingTasteFinder({ dashboardHref }: OnboardingTasteFinderProps) {
  const [selectedTasteProfile, setSelectedTasteProfile] = useState<TasteProfileKey | null>(null);
  const selectedPreset = selectedTasteProfile ? tasteProfilePresetByKey[selectedTasteProfile] : null;
  const activationHref = useMemo(
    () => hrefWithTasteProfile(dashboardHref, selectedTasteProfile),
    [dashboardHref, selectedTasteProfile],
  );
  const previewTags = selectedPreset?.formDefaults.tags.slice(0, 3) ?? ["Citrus", "Caramel", "Cacao"];
  const previewMetrics = selectedPreset?.metricPreview ?? "산미 - / 단맛 - / 바디 -";

  return (
    <div className="grid gap-5">
      <div className="rounded-[1.75rem] border border-[#fff8ec]/12 bg-[#1d120d]/86 p-4 shadow-[0_28px_86px_rgba(0,0,0,0.46)] ring-1 ring-[#c77a48]/12 backdrop-blur sm:rounded-[2rem] sm:p-5">
        <div className="flex items-end justify-between gap-4 border-b border-[#fff8ec]/10 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#b86b3d]">
              Quick-record preset
            </p>
            <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-[#fff8ec] md:text-3xl">
              빠른 기록의 맛 방향을 먼저 골라요
            </h2>
          </div>
          <span className="hidden rounded-full border border-[#fff8ec]/12 bg-[#fff8ec]/8 px-3 py-1.5 text-xs font-black text-[#d8c8b6] sm:block">선택 1개</span>
        </div>

        <div className="mt-4 grid gap-2" role="group" aria-label="Taste Finder profile">
          {tasteProfileDisplays.map((profile) => {
            const preset = tasteProfilePresetByKey[profile.key];
            const isSelected = selectedTasteProfile === profile.key;
            const Icon = profile.icon;
            return (
              <button
                key={profile.key}
                type="button"
                aria-pressed={isSelected}
                data-testid={`taste-profile-${profile.key}`}
                onClick={() => setSelectedTasteProfile(profile.key)}
                className={`group grid w-full grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:grid-cols-[2.25rem_3rem_minmax(0,1fr)_1.5rem] sm:px-4 sm:py-4 ${
                  isSelected
                    ? "border-[#c77a48]/76 bg-[#c77a48]/18 text-[#fff8ec] shadow-[0_18px_40px_rgba(199,122,72,0.16)]"
                    : "border-[#fff8ec]/12 bg-[#fff8ec]/7 text-[#eadccd] hover:border-[#c77a48]/40 hover:bg-[#fff8ec]/11"
                }`}
              >
                <span className={`grid size-8 place-items-center rounded-full border ${isSelected ? "border-[#c77a48] bg-[#c77a48] text-white" : "border-[#fff8ec]/22 bg-[#120b08] text-[#bca995]"}`}>
                  {isSelected ? <Check size={16} /> : <Circle size={16} />}
                </span>
                <span className={`hidden size-12 place-items-center rounded-2xl border sm:grid ${isSelected ? "border-[#c77a48]/44 bg-[#fff8ec] text-[#c77a48]" : "border-[#fff8ec]/12 bg-[#120b08] text-[#b86b3d]"}`}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block break-keep font-serif text-lg font-black leading-tight sm:text-xl">{profile.title}</span>
                  <span className="mt-1 block break-keep text-sm font-semibold leading-6 text-current/62">{profile.subtitle}</span>
                  <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.16em] text-[#b86b3d]">
                    {preset.notes}
                  </span>
                </span>
                <span className="text-primary-amber/72 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight size={18} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[1.4rem] bg-[#fff8ec] p-4 text-[#2f251f] shadow-[0_18px_44px_rgba(0,0,0,0.22)] sm:rounded-[1.6rem]">
          <div className="flex items-center justify-between border-b border-[#2f251f]/12 pb-3">
            <p className="text-sm font-black text-[#9f6a4a]">20초 기록 프리셋</p>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6f6258]">
              {selectedPreset ? "ready" : "waiting"}
            </span>
          </div>

          <div className="grid gap-3 py-4 text-sm">
            <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
              <span className="font-black">커피 이름</span>
              <span className="text-[#6f6258]">기록을 시작하면 여기에 표시돼요</span>
            </div>
            <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
              <span className="font-black">맛의 방향</span>
              <span className="font-extrabold text-[#9f6a4a]" data-testid="taste-profile-selection-copy">
                {selectedPreset ? selectedPreset.label : "선택한 취향이 여기에 표시돼요"}
              </span>
            </div>
            <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5.5rem_minmax(0,1fr)]">
              <span className="font-black">향미 태그</span>
              <span className="flex flex-wrap gap-1.5">
                {previewTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#9f6a4a]/22 px-2 py-1 text-[11px] font-black text-[#9f6a4a]">
                    {tag}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2f251f]/12 bg-white/45 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6f6258]">Taste balance</p>
            <p className="mt-2 text-sm font-extrabold text-[#2f251f]">{previewMetrics}</p>
            <p className="mt-2 break-keep text-xs font-semibold leading-5 text-[#6f6258]">
              {selectedPreset ? selectedPreset.cue : "취향을 고르면 빠른 기록에 향미 힌트가 먼저 담깁니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Link
          href={activationHref}
          data-testid="onboarding-first-card-cta"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#d8965f] bg-[#c77a48] px-5 text-center text-sm font-black leading-5 text-white shadow-[0_18px_46px_rgba(199,122,72,0.26)] transition hover:-translate-y-0.5 hover:bg-[#b86b3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f251f]/20 sm:text-base"
          style={{ color: "#fffaf2" }}
        >
          <span className="break-keep">20초 빠른 기록 시작하기</span>
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#fff8ec]/16 bg-[#fff8ec]/8 px-5 text-center text-sm font-black leading-5 text-[#fff8ec] shadow-[0_14px_34px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-[#c77a48]/42 hover:bg-[#fff8ec]/13 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c77a48]/30 sm:w-auto"
          style={{ color: "#fff8ec" }}
        >
          <ScanLine size={16} />
          <span className="break-keep">샘플 CoffeeDex 기록 보기</span>
        </Link>
      </div>
    </div>
  );
}
