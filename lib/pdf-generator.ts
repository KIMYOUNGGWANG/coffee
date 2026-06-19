import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type CoffeeDexPdfCard = {
  readonly title?: string | null;
  readonly subtitle?: string | null;
  readonly metric1?: number | null;
  readonly metric2?: number | null;
  readonly metric3?: number | null;
  readonly tags?: readonly string[] | null;
  readonly ai_description?: string | null;
};

export type CoffeeDexPdfDocument = {
  readonly ownerLabel: string;
  readonly exportedAt: string;
  readonly cards: readonly CoffeeDexPdfCard[];
};

function metricText(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-";
}

function tagsText(tags: readonly string[] | null | undefined): string {
  if (!tags || tags.length === 0) {
    return "태그: -";
  }
  return `태그: ${tags.slice(0, 5).join(", ")}`;
}

function averageMetric(cards: readonly CoffeeDexPdfCard[], field: "metric1" | "metric2" | "metric3"): string {
  const values = cards
    .map((card) => card[field])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (values.length === 0) {
    return "-";
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
}

function topRoaster(cards: readonly CoffeeDexPdfCard[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const roaster = (card.subtitle ?? "").trim();
    if (roaster.length > 0) {
      counts.set(roaster, (counts.get(roaster) ?? 0) + 1);
    }
  }
  const entries = Array.from(counts.entries());
  if (entries.length === 0) return "-";
  const [winner] = entries.sort((left, right) => right[1] - left[1]);
  return winner ? `${winner[0]} (${winner[1]}개)` : "-";
}

export async function generateCoffeeDexTastePassportPdf(
  document: CoffeeDexPdfDocument,
  fontBuffer: ArrayBuffer | Uint8Array
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const customFont = await pdfDoc.embedFont(fontBuffer);

  let page = pdfDoc.addPage([612, 792]); // Letter size (8.5 x 11 inches)
  const { width, height } = page.getSize();

  // Draw margins and border
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: rgb(0.8, 0.64, 0.48), // Caramel
    borderWidth: 1.5,
  });

  let yOffset = height - 80;

  // Header Title
  page.drawText("CoffeeDex Taste Passport", {
    x: 60,
    y: yOffset,
    size: 20,
    font: customFont,
    color: rgb(0.1, 0.08, 0.06), // Espresso dark
  });
  yOffset -= 24;

  // Meta Info
  const owner = document.ownerLabel || "CoffeeDex User";
  page.drawText(`소유자 (Owner): ${owner}`, { x: 60, y: yOffset, size: 10, font: customFont, color: rgb(0.3, 0.25, 0.2) });
  yOffset -= 14;
  page.drawText(`내보낸 날짜 (Exported): ${document.exportedAt.slice(0, 10)}`, { x: 60, y: yOffset, size: 10, font: customFont, color: rgb(0.3, 0.25, 0.2) });
  yOffset -= 14;
  page.drawText(`총 카드 수 (Cards): ${document.cards.length}개`, { x: 60, y: yOffset, size: 10, font: customFont, color: rgb(0.3, 0.25, 0.2) });
  yOffset -= 24;

  // Recap Section
  page.drawText("CoffeeDex Taste Recap (취향 리캡 요약)", {
    x: 60,
    y: yOffset,
    size: 14,
    font: customFont,
    color: rgb(0.6, 0.4, 0.2), // Warm Caramel
  });
  yOffset -= 16;

  const avgAcidity = averageMetric(document.cards, "metric1");
  const avgSweetness = averageMetric(document.cards, "metric2");
  const avgBody = averageMetric(document.cards, "metric3");
  const roasterSummary = topRoaster(document.cards);

  page.drawText(`평균 맛 스펙트럼 (Taste Map): 산미 ${avgAcidity} / 단맛 ${avgSweetness} / 바디감 ${avgBody}`, {
    x: 60,
    y: yOffset,
    size: 10,
    font: customFont,
  });
  yOffset -= 14;
  page.drawText(`주요 로스터리 히스토리 (Roaster Memory): ${roasterSummary}`, {
    x: 60,
    y: yOffset,
    size: 10,
    font: customFont,
  });
  yOffset -= 30;

  // Divider Line
  page.drawLine({
    start: { x: 60, y: yOffset },
    end: { x: width - 60, y: yOffset },
    thickness: 1,
    color: rgb(0.9, 0.85, 0.8),
  });
  yOffset -= 24;

  // Tasting Cards List
  page.drawText("아카이빙 테이스팅 노트 리스트", {
    x: 60,
    y: yOffset,
    size: 14,
    font: customFont,
    color: rgb(0.6, 0.4, 0.2),
  });
  yOffset -= 20;

  const displayCards = document.cards.slice(0, 10);
  if (displayCards.length === 0) {
    page.drawText("아직 저장된 테이스팅 카드가 없습니다.", { x: 60, y: yOffset, size: 10, font: customFont, color: rgb(0.5, 0.5, 0.5) });
  } else {
    for (const [index, card] of displayCards.entries()) {
      if (yOffset < 100) {
        // Add a new page if list overflows
        page = pdfDoc.addPage([612, 792]);
        page.drawRectangle({
          x: 40,
          y: 40,
          width: width - 80,
          height: height - 80,
          borderColor: rgb(0.8, 0.64, 0.48),
          borderWidth: 1.5,
        });
        yOffset = height - 80;
      }

      const title = card.title || "이름 없는 원두";
      const subtitle = card.subtitle || "로스터리 미상";
      const acidity = metricText(card.metric1);
      const sweetness = metricText(card.metric2);
      const body = metricText(card.metric3);
      const note = card.ai_description || "";

      page.drawText(`${index + 1}. ${title} - ${subtitle}`, {
        x: 60,
        y: yOffset,
        size: 11,
        font: customFont,
        color: rgb(0.1, 0.08, 0.06),
      });
      yOffset -= 14;

      page.drawText(`맛 강도: 산미 ${acidity} / 단맛 ${sweetness} / 바디감 ${body}`, {
        x: 80,
        y: yOffset,
        size: 9.5,
        font: customFont,
        color: rgb(0.3, 0.25, 0.2),
      });
      yOffset -= 12;

      page.drawText(tagsText(card.tags), {
        x: 80,
        y: yOffset,
        size: 9.5,
        font: customFont,
        color: rgb(0.3, 0.25, 0.2),
      });
      yOffset -= 12;

      if (note) {
        const slicedNote = note.length > 70 ? `${note.slice(0, 67)}...` : note;
        page.drawText(`AI 노트: "${slicedNote}"`, {
          x: 80,
          y: yOffset,
          size: 9,
          font: customFont,
          color: rgb(0.4, 0.35, 0.3),
        });
        yOffset -= 16;
      } else {
        yOffset -= 8;
      }
      yOffset -= 10; // Extra spacing between cards
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
