export type HyangmiPdfCard = {
  readonly title?: string | null;
  readonly subtitle?: string | null;
  readonly metric1?: number | null;
  readonly metric2?: number | null;
  readonly metric3?: number | null;
  readonly tags?: readonly string[] | null;
  readonly ai_description?: string | null;
};

export type HyangmiPdfDocument = {
  readonly ownerLabel: string;
  readonly exportedAt: string;
  readonly cards: readonly HyangmiPdfCard[];
};

function printableAscii(value: string, fallback: string): string {
  const printable = value.normalize("NFKD").replace(/[^\x20-\x7E]+/g, " ");
  const compact = printable.replace(/\s+/g, " ").trim();
  return compact.length > 0 ? compact : fallback;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function limitText(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function metricText(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "-";
}

function tagsText(tags: readonly string[] | null | undefined): string {
  if (!tags || tags.length === 0) {
    return "Tags: -";
  }
  return `Tags: ${tags.map((tag) => printableAscii(tag, "tag")).slice(0, 5).join(", ")}`;
}

function buildCardLines(card: HyangmiPdfCard, index: number): readonly string[] {
  const title = printableAscii(card.title ?? "", "Untitled coffee");
  const subtitle = printableAscii(card.subtitle ?? "", "Unknown roaster");
  const scores = `${metricText(card.metric1)}/${metricText(card.metric2)}/${metricText(card.metric3)}`;
  const note = printableAscii(card.ai_description ?? "", "");
  const baseLines = [`${index + 1}. ${title} - ${subtitle}`, `Taste scores: ${scores}`, tagsText(card.tags)];
  return note.length > 0 ? [...baseLines, `Note: ${limitText(note, 76)}`, ""] : [...baseLines, ""];
}

function averageMetric(cards: readonly HyangmiPdfCard[], field: "metric1" | "metric2" | "metric3"): string {
  const values = cards
    .map((card) => card[field])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (values.length === 0) {
    return "-";
  }
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
}

function topRoaster(cards: readonly HyangmiPdfCard[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const roaster = printableAscii(card.subtitle ?? "", "").trim();
    if (roaster.length > 0) {
      counts.set(roaster, (counts.get(roaster) ?? 0) + 1);
    }
  }
  const [winner] = Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
  return winner ? `${winner[0]} (${winner[1]} cards)` : "-";
}

function buildDocumentLines(document: HyangmiPdfDocument): readonly string[] {
  const owner = printableAscii(document.ownerLabel, "Hyangmi user");
  const cardLines = document.cards.length > 0
    ? document.cards.slice(0, 10).flatMap((card, index) => buildCardLines(card, index))
    : ["No tasting cards yet."];
  return [
    "Hyangmi Taste Passport",
    `Owner: ${owner}`,
    `Exported: ${printableAscii(document.exportedAt, "unknown")}`,
    `Cards: ${document.cards.length}`,
    "",
    "Hyangmi Recap",
    `Taste Map: acidity ${averageMetric(document.cards, "metric1")} / sweetness ${averageMetric(document.cards, "metric2")} / body ${averageMetric(document.cards, "metric3")}`,
    `Roaster Memory: ${topRoaster(document.cards)}`,
    "",
    ...cardLines,
  ].slice(0, 42);
}

function textCommand(value: string): string {
  return `(${escapePdfText(limitText(value, 92))}) Tj`;
}

function buildContentStream(lines: readonly string[]): string {
  const title = lines[0] ?? "Hyangmi Taste Passport";
  const commands = ["BT", "/F1 18 Tf", "72 750 Td", textCommand(title), "/F1 10 Tf"];
  for (const line of lines.slice(1)) {
    commands.push("0 -16 Td", textCommand(line));
  }
  commands.push("ET");
  return commands.join("\n");
}

function formatOffset(offset: number): string {
  return offset.toString().padStart(10, "0");
}

function buildPdf(objects: readonly string[]): string {
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const [index, object] of objects.entries()) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  return `${pdf}${buildXref(offsets)}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
}

function buildXref(offsets: readonly number[]): string {
  const entries = offsets.map((offset) => `${formatOffset(offset)} 00000 n \n`).join("");
  return `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n${entries}`;
}

export function generateHyangmiTastePassportPdf(document: HyangmiPdfDocument): ArrayBuffer {
  const content = buildContentStream(buildDocumentLines(document));
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const encoded = new TextEncoder().encode(buildPdf(objects));
  const output = new ArrayBuffer(encoded.byteLength);
  new Uint8Array(output).set(encoded);
  return output;
}
