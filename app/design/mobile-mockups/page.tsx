import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Archive,
  BookOpen,
  Camera,
  ChevronRight,
  Compass,
  Home,
  Settings,
  Sparkles,
  Stamp,
  User,
} from "lucide-react";

export const metadata: Metadata = {
  title: "CoffeeDex Mobile Standard",
  description: "A polished mobile design standard for CoffeeDex.",
};

const references = [
  {
    label: "브랜드 톤",
    copy: "낮은 조도, 다크 우드, 앰버 포인트로 기록 경험을 더 깊게 만듭니다.",
  },
  {
    label: "분석 표면",
    copy: "데이터는 밝은 세라믹 패널 위에 올려 산미, 단맛, 바디가 바로 읽히게 합니다.",
  },
  {
    label: "제품 기준",
    copy: "개인 기록, 스캔 초안, Taste Passport 범위 안에서만 표현합니다.",
  },
];

const tasteMetrics = [
  { label: "산미", value: "82%", width: "82%" },
  { label: "단맛", value: "91%", width: "91%" },
  { label: "바디", value: "58%", width: "58%" },
];

const radarPoints = ["50,16", "82,39", "68,76", "32,70", "18,39"] as const;
const radarShapePoints = radarPoints.join(" ");

const navItems = [
  { label: "선반", icon: Home, active: true },
  { label: "기록", icon: Archive, active: false },
  { label: "여권", icon: BookOpen, active: false },
  { label: "설정", icon: Settings, active: false },
];

export default function MobileMockupsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <section className="order-2 lg:sticky lg:top-6 lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d9a05b]/30 bg-[#d9a05b]/10 px-3 py-1.5 text-xs font-bold text-[#d9a05b]">
            <Sparkles size={14} aria-hidden="true" />
            CoffeeDex 모바일 기준안
          </div>
          <h1 className="mt-4 text-4xl font-black leading-[1.05] text-foreground md:text-5xl">
            향미 기록실
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-muted-foreground">
            기존 다크 바 무드와 Taste Passport 문법은 유지하되, 분석 카드는 더 밝고 촉각적인 세라믹 표면으로
            정리했습니다. 이제 설명보다 실제 모바일 화면이 먼저 보이도록 구성했습니다.
          </p>

          <div className="mt-6 grid gap-3">
            {references.map((item) => (
              <div key={item.label} className="dashboard-panel p-4">
                <p className="text-xs font-black text-[#d9a05b]">{item.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{item.copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[#d9a05b]/18 bg-[#d9a05b]/10 p-4">
            <p className="text-xs font-black text-[#d9a05b]">디자인 원칙</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              홈은 낮은 조도로 몰입시키고, 분석은 밝은 표면으로 분리합니다. 브랜드 기억감과 정보 가독성을 동시에 가져가기 위한 기준입니다.
            </p>
          </div>
        </section>

        <section className="order-1 flex justify-center lg:order-2">
          <PhoneFrame>
            <EspressoLabScreen />
          </PhoneFrame>
        </section>
      </div>
    </main>
  );
}

function PhoneFrame({ children }: { readonly children: ReactNode }) {
  return (
    <div className="w-full max-w-[390px] rounded-[34px] border border-white/14 bg-[#050403] p-2 shadow-[0_34px_90px_rgba(0,0,0,0.55)]">
      <div className="relative h-[844px] overflow-hidden rounded-[28px] bg-[#0b0705]">{children}</div>
    </div>
  );
}

function EspressoLabScreen() {
  return (
    <div className="relative h-full overflow-hidden bg-[#0b0705] text-[#f7f1e8]">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(217,160,91,0.38),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(72,39,17,0.34),transparent_36%,rgba(0,0,0,0.45))]" />

      <div className="relative flex h-full flex-col px-5 pb-5 pt-7">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d9a05b]">CoffeeDex</p>
            <h2 className="mt-1 font-serif text-[1.85rem] font-black leading-none">향미 선반</h2>
          </div>
          <button
            type="button"
            aria-label="내 프로필"
            className="flex size-11 items-center justify-center rounded-full border border-[#d9a05b]/24 bg-[#d9a05b]/12 text-[#d9a05b]"
          >
            <User size={18} aria-hidden="true" />
          </button>
        </header>

        <section className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["기록", "24"],
            ["원산지", "08"],
            ["이번 달", "06"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#d9a05b]/14 bg-white/[0.045] px-3 py-2.5">
              <p className="text-[10px] font-bold text-[#f7f1e8]/50">{label}</p>
              <p className="mt-0.5 font-serif text-[1.45rem] font-black text-[#f7f1e8]">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-3 rounded-3xl border border-[#d9a05b]/22 bg-[#17100b]/92 p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-[#d9a05b]">오늘의 스탬프</p>
              <h3 className="mt-1 font-serif text-[1.45rem] font-black leading-tight">Ethiopia<br />Aricha Natural</h3>
            </div>
            <div className="flex size-11 items-center justify-center rounded-full border border-[#d9a05b]/28 bg-[#d9a05b]/10">
              <Stamp size={20} className="text-[#d9a05b]" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[0.72fr_1.28fr] gap-4">
            <div className="rounded-2xl border border-[#d9a05b]/16 bg-black/24 p-3">
              <CoffeeBag className="h-24 w-full object-contain drop-shadow-2xl" />
            </div>
            <div className="flex min-w-0 flex-col justify-end">
              <p className="text-[11px] font-bold text-[#f7f1e8]/52">스캔 초안</p>
              <p className="mt-2 text-sm font-bold leading-5 text-[#f7f1e8]/86">
                백도와 재스민, 꿀 같은 단맛이 깨끗하게 이어지는 컵.
              </p>
              <button
                type="button"
                className="mt-3 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#d9a05b] px-3 text-xs font-black text-[#0b0705]"
              >
                저장 전 확인
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[1.55rem] bg-[#e9ded0] p-3.5 text-[#2f251f] shadow-[12px_16px_34px_rgba(0,0,0,0.28),inset_-8px_-8px_18px_rgba(255,250,240,0.62),inset_8px_8px_18px_rgba(84,65,45,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black text-[#8b5e3b]">취향 지도</p>
              <h3 className="mt-1 font-serif text-[1.45rem] font-black">Floral Sweet</h3>
            </div>
            <Compass size={24} className="text-[#8b5e3b]" aria-hidden="true" />
          </div>

          <div className="mt-3 grid grid-cols-[0.86fr_1.14fr] gap-3">
            <div className="rounded-[1.2rem] bg-[#eadfce] p-2 shadow-[inset_8px_8px_16px_rgba(84,65,45,0.18),inset_-8px_-8px_18px_rgba(255,250,240,0.86)]">
              <svg viewBox="0 0 100 100" className="size-full min-h-28 text-[#8b5e3b]" aria-label="5각형 취향 레이더 차트">
                <polygon points="50,8 90,37 75,84 25,84 10,37" fill="rgba(139,94,59,0.07)" stroke="rgba(139,94,59,0.2)" />
                <polygon points="50,22 76,41 66,72 34,72 24,41" fill="none" stroke="rgba(139,94,59,0.22)" />
                <polygon points={radarShapePoints} fill="rgba(139,94,59,0.34)" stroke="currentColor" strokeWidth="1.8" />
                {radarPoints.map((point) => {
                  const [cx, cy] = point.split(",");
                  return <circle key={point} cx={cx} cy={cy} r="2.4" fill="currentColor" />;
                })}
                <Sparkles x={44} y={41} width={12} height={12} className="text-[#d9a05b]" aria-hidden="true" />
                <text x="50" y="58" textAnchor="middle" className="fill-[#2f251f] font-serif text-[18px] font-black">
                  91
                </text>
              </svg>
            </div>
            <div className="grid content-center gap-2.5">
              {tasteMetrics.map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-[11px] font-black">
                    <span>{metric.label}</span>
                    <span>{metric.value}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-[#d4c3b0] shadow-[inset_3px_3px_7px_rgba(84,65,45,0.14)]">
                    <div className="h-full rounded-full bg-[#8b5e3b]" style={{ width: metric.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-auto">
          <button
            type="button"
            className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#d9a05b] text-sm font-black text-[#0b0705] shadow-[0_14px_30px_rgba(217,160,91,0.18)]"
          >
            새 원두 라벨 스캔
            <Camera size={17} aria-hidden="true" />
          </button>
          <nav className="grid grid-cols-4 rounded-2xl border border-white/10 bg-[#17100b]/92 p-2 backdrop-blur">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`flex min-h-10 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-black ${
                  item.active ? "bg-[#d9a05b] text-[#0b0705]" : "text-[#f7f1e8]/46"
                }`}
              >
                <item.icon size={15} aria-hidden="true" />
                {item.label}
              </div>
            ))}
          </nav>
        </div>

      </div>
    </div>
  );
}

function CoffeeBag({ className }: { readonly className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/onboarding/private-espresso-coffee-bag.png"
      alt="커피 원두 패키지"
      className={className}
    />
  );
}
