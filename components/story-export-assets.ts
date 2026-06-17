import type { TastingCardData } from "@/hooks/useTastingCards";
import { hyangmiBrand } from "@/lib/brand";
import { createPublicCardUrl } from "@/lib/public-card";

export const STORY_SKIN_KEYS = ["dark", "cream", "copper", "forest"] as const;

export type SkinType = (typeof STORY_SKIN_KEYS)[number];

type StoryPalette = {
  readonly background: string;
  readonly panel: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly border: string;
  readonly badge: string;
};

const storySansFont = "IBM Plex Sans KR, Arial, sans-serif";
const storySerifFont = "Noto Serif KR, Georgia, serif";

export type StorySkin = {
  readonly name: string;
  readonly bg: string;
  readonly cardBg: string;
  readonly textColor: string;
  readonly subColor: string;
  readonly accentBg: string;
  readonly badgeBg: string;
  readonly divider: string;
  readonly swatch: string;
  readonly svg: StoryPalette;
};

export const STORY_SKINS: Record<SkinType, StorySkin> = {
  dark: {
    name: "다크 에스프레소",
    bg: "bg-gradient-to-b from-[#1E1915] via-[#120F0D] to-[#0A0807]",
    cardBg: "bg-[#25201C]/80 border-[#38302A]",
    textColor: "text-[#ECEAE5]",
    subColor: "text-[#C58948]/70",
    accentBg: "bg-[#C58948]/15 text-[#C58948]",
    badgeBg: "bg-[#2A231E] text-[#ECEAE5]/80 border-[#3D352F]",
    divider: "border-[#322A24]",
    swatch: "bg-[#1E1915]",
    svg: { background: "#120F0D", panel: "#25201C", text: "#ECEAE5", muted: "#B6A99F", accent: "#C58948", border: "#38302A", badge: "#2A231E" },
  },
  cream: {
    name: "에디토리얼 크림",
    bg: "bg-gradient-to-b from-[#FAF8F5] via-[#F4F1EA] to-[#EAE6DB]",
    cardBg: "bg-white/95 border-[#E2DFD5] shadow-md",
    textColor: "text-[#28221D]",
    subColor: "text-[#A0703B]",
    accentBg: "bg-[#A0703B]/10 text-[#A0703B]",
    badgeBg: "bg-[#EFECE3] text-[#28221D]/80 border-[#DBD7CB]",
    divider: "border-[#ECE8DD]",
    swatch: "bg-[#F4F1EA]",
    svg: { background: "#F4F1EA", panel: "#FFFFFF", text: "#28221D", muted: "#75685D", accent: "#A0703B", border: "#E2DFD5", badge: "#EFECE3" },
  },
  copper: {
    name: "네추럴 코퍼",
    bg: "bg-gradient-to-b from-[#5C3D2E] via-[#3D2C24] to-[#2D1B13]",
    cardBg: "bg-[#473024]/90 border-[#6D4937]",
    textColor: "text-[#FDFBF7]",
    subColor: "text-[#E8AA42]/80",
    accentBg: "bg-[#E8AA42]/15 text-[#E8AA42]",
    badgeBg: "bg-[#3D271E] text-[#FDFBF7]/85 border-[#573A2D]",
    divider: "border-[#50352A]",
    swatch: "bg-[#5C3D2E]",
    svg: { background: "#3D2C24", panel: "#473024", text: "#FDFBF7", muted: "#D5B79F", accent: "#E8AA42", border: "#6D4937", badge: "#3D271E" },
  },
  forest: {
    name: "딥 포레스트",
    bg: "bg-gradient-to-b from-[#1A3326] via-[#102018] to-[#070E0A]",
    cardBg: "bg-[#213F2F]/85 border-[#2A523D]",
    textColor: "text-[#E6EFEA]",
    subColor: "text-[#E2C39B]/85",
    accentBg: "bg-[#E2C39B]/15 text-[#E2C39B]",
    badgeBg: "bg-[#162B20] text-[#E6EFEA]/80 border-[#224433]",
    divider: "border-[#254A36]",
    swatch: "bg-[#1A3326]",
    svg: { background: "#102018", panel: "#213F2F", text: "#E6EFEA", muted: "#B7CEC1", accent: "#E2C39B", border: "#2A523D", badge: "#162B20" },
  },
};

function escapeSvg(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function createStoryFilename(title: string): string {
  const slug = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return `${hyangmiBrand.filenameSlug}-story-${slug || "card"}.svg`;
}

function clampMetric(value: number): number {
  return Math.max(0, Math.min(5, value));
}

function truncateText(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function wrapStoryText(value: string): readonly string[] {
  const words = value.trim().replace(/\s+/g, " ").split(" ");
  const lines = words.reduce<string[]>((accumulator, word) => {
    const current = accumulator.at(-1) || "";
    const next = current ? `${current} ${word}` : word;
    return next.length > 28 ? [...accumulator, word] : [...accumulator.slice(0, -1), next];
  }, [""]);
  return lines.filter(Boolean).slice(0, 3);
}

function metricSvg(label: string, value: number, y: number, skin: StorySkin): string {
  const width = 640 * (clampMetric(value) / 5);
  return `<text x="180" y="${y}" font-size="30" font-family="${storySansFont}" fill="${skin.svg.muted}">${label}</text><text x="900" y="${y}" text-anchor="end" font-size="30" font-family="${storySansFont}" fill="${skin.svg.text}">${value} / 5</text><rect x="180" y="${y + 28}" width="720" height="12" fill="${skin.svg.border}"/><rect x="180" y="${y + 28}" width="${width}" height="12" fill="${skin.svg.accent}"/>`;
}

function tagSvg(tag: string, index: number, skin: StorySkin): string {
  const x = 180 + index * 205;
  return `<rect x="${x}" y="1110" width="180" height="52" fill="${skin.svg.badge}" stroke="${skin.svg.border}"/><text x="${x + 90}" y="1145" text-anchor="middle" font-size="26" font-weight="700" font-family="${storySansFont}" fill="${skin.svg.text}">#${escapeSvg(truncateText(tag, 10))}</text>`;
}

export function storySvg(card: TastingCardData, skin: StorySkin, dateText: string, originText: string): string {
  const quote = wrapStoryText(card.ai_description || "조화롭고 밸런스가 돋보이는 컵.");
  const quoteSvg = quote.map((line, index) => `<text x="180" y="${1250 + index * 44}" font-size="32" font-style="italic" font-family="${storySerifFont}" fill="${skin.svg.text}" opacity="0.86">${index === 0 ? "“" : ""}${escapeSvg(line)}${index === quote.length - 1 ? "”" : ""}</text>`).join("");
  const tags = card.tags.slice(0, 3).map((tag, index) => tagSvg(tag, index, skin)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="${skin.svg.background}"/><path d="M96 220H984M96 330H984M96 1510H984" stroke="${skin.svg.border}" stroke-width="3" opacity="0.58"/><text x="96" y="140" font-size="26" font-weight="800" letter-spacing="8" font-family="${storySansFont}" fill="${skin.svg.accent}">HYANGMI ARCHIVE</text><text x="984" y="140" text-anchor="end" font-size="24" font-family="${storySansFont}" fill="${skin.svg.muted}">${escapeSvg(dateText)}</text><rect x="96" y="390" width="888" height="900" fill="${skin.svg.panel}" stroke="${skin.svg.border}" stroke-width="3"/><rect x="160" y="470" width="230" height="54" fill="${skin.svg.badge}" stroke="${skin.svg.border}"/><text x="275" y="506" text-anchor="middle" font-size="24" font-weight="800" font-family="${storySansFont}" fill="${skin.svg.accent}">${escapeSvg(card.badges[0] || "Single Origin")}</text><rect x="762" y="470" width="134" height="134" fill="${skin.svg.badge}" stroke="${skin.svg.border}" stroke-width="3"/><text x="829" y="552" text-anchor="middle" font-size="60" font-family="${storySerifFont}" fill="${skin.svg.accent}">${escapeSvg(card.title.slice(0, 1).toUpperCase())}</text><text x="160" y="615" font-size="56" font-weight="800" font-family="${storySerifFont}" fill="${skin.svg.text}">${escapeSvg(truncateText(card.title, 22))}</text><text x="160" y="674" font-size="32" font-family="${storySansFont}" fill="${skin.svg.muted}">${escapeSvg(truncateText(card.subtitle, 34))}</text>${metricSvg("산미 (Acidity)", card.metric1, 790, skin)}${metricSvg("단맛 (Sweetness)", card.metric2, 900, skin)}${metricSvg("바디감 (Body)", card.metric3, 1010, skin)}${tags}<line x1="160" x2="920" y1="1208" y2="1208" stroke="${skin.svg.border}" stroke-width="3"/>${quoteSvg}<text x="540" y="1580" text-anchor="middle" font-size="28" font-family="${storySansFont}" fill="${skin.svg.muted}">Origin: ${escapeSvg(originText)}</text><line x1="500" x2="580" y1="1625" y2="1625" stroke="${skin.svg.border}" stroke-width="3"/><text x="540" y="1688" text-anchor="middle" font-size="22" font-weight="800" letter-spacing="6" font-family="${storySansFont}" fill="${skin.svg.muted}">PUBLIC HYANGMI CARD</text><text x="540" y="1730" text-anchor="middle" font-size="22" font-weight="800" letter-spacing="6" font-family="${storySansFont}" fill="${skin.svg.muted}">SHARED VIA HYANGMI</text></svg>`;
}

export { createPublicCardUrl };
