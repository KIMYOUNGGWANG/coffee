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
      <div className="rounded-[1.75rem] border border-primary-amber/14 bg-[#110c08]/88 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:rounded-[2rem] sm:p-5">
        <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-amber">
              30-second Taste Finder
            </p>
            <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-[#F7F7F4] md:text-3xl">
              오늘의 취향은 어떤 방향인가요?
            </h2>
          </div>
          <span className="hidden text-xs font-black text-[#F7F7F4]/42 sm:block">선택 1개</span>
        </div>

        <div className="mt-4 divide-y divide-white/10" role="group" aria-label="Taste Finder profile">
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
                className={`group grid w-full grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-center gap-3 py-4 text-left transition sm:grid-cols-[2.25rem_3rem_minmax(0,1fr)_1.5rem] ${
                  isSelected
                    ? "text-[#F7F7F4]"
                    : "text-[#F7F7F4]/72 hover:text-[#F7F7F4]"
                }`}
              >
                <span className={`grid size-8 place-items-center rounded-full border ${isSelected ? "border-primary-amber bg-primary-amber text-background-dark" : "border-white/24 text-white/32"}`}>
                  {isSelected ? <Check size={16} /> : <Circle size={16} />}
                </span>
                <span className={`hidden size-12 place-items-center rounded-2xl border sm:grid ${isSelected ? "border-primary-amber/40 bg-primary-amber/12 text-primary-amber" : "border-white/10 bg-white/[0.03] text-primary-amber/78"}`}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block break-keep font-serif text-lg font-black leading-tight sm:text-xl">{profile.title}</span>
                  <span className="mt-1 block break-keep text-sm font-semibold leading-6 text-current/62">{profile.subtitle}</span>
                  <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/82">
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

        <div className="mt-5 rounded-[1.4rem] bg-[#f6efe3] p-4 text-[#2f251f] shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:rounded-[1.6rem]">
          <div className="flex items-center justify-between border-b border-[#2f251f]/12 pb-3">
            <p className="text-sm font-black text-[#9f6a4a]">첫 Taste Card 미리보기</p>
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
              {selectedPreset ? selectedPreset.cue : "취향을 고르면 빠른 기록의 산미, 단맛, 바디 기준이 먼저 잡힙니다."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Link
          href={activationHref}
          data-testid="onboarding-first-card-cta"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-primary-amber bg-primary-amber px-5 text-center text-sm font-black leading-5 text-[#120B07] shadow-[0_16px_42px_rgba(217,160,91,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-[#F0B978] sm:text-base"
        >
          <span className="break-keep">20초 빠른 기록 시작하기</span>
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/[0.075] px-5 text-center text-sm font-black leading-5 text-[#F7F7F4] transition hover:-translate-y-0.5 hover:border-primary-amber/40 hover:bg-white/[0.11] hover:text-primary-amber sm:w-auto"
        >
          <ScanLine size={16} />
          <span className="break-keep">샘플 CoffeeDex 기록 보기</span>
        </Link>
      </div>
    </div>
  );
}
