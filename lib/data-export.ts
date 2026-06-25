import { z } from "zod";

const isoTimestampSchema = z.string().datetime({ offset: true })
  .transform((timestamp) => new Date(timestamp).toISOString());
const nullableTimestampSchema = isoTimestampSchema.nullable();
const nullableTextSchema = z.string().nullable();
const uuidSchema = z.string().uuid();

const ownedRowSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
}).strict();

const footerMetaSchema = z.object({
  origin: z.string().optional(),
  date: z.string().optional(),
  extraInfo: z.string().optional(),
}).strict().readonly();

export const coffeeDexExportMemorySchema = ownedRowSchema.extend({
  category: z.enum(["coffee", "beer", "whiskey", "wine"]),
  title: z.string(),
  subtitle: z.string(),
  image_url: nullableTextSchema,
  badges: z.array(z.string()).readonly(),
  metric1: z.number().int().min(1).max(5),
  metric2: z.number().int().min(1).max(5),
  metric3: z.number().int().min(1).max(5),
  metric4: z.number().int().min(1).max(5).optional(),
  metric5: z.number().int().min(1).max(5).optional(),
  metric6: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).readonly(),
  ai_description: z.string(),
  footer_meta: footerMetaSchema,
  package_origin: nullableTextSchema,
  package_process: nullableTextSchema,
  repurchase_intent: z.enum(["again", "maybe", "no", "undecided"]),
  repurchase_reasons: z.array(z.string()).readonly(),
  scan_source: z.enum(["gemini", "manual"]).nullable(),
  scan_confidence: z.number().min(0).max(1).nullable(),
  corrected_fields: z.array(z.enum([
    "title", "subtitle", "package_origin", "package_process", "tags",
  ])).readonly(),
  confirmed_at: nullableTimestampSchema,
  is_public: z.boolean(),
  public_share_token: nullableTextSchema,
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
}).strict().readonly();

const brewingNoteSchema = ownedRowSchema.extend({
  tasting_card_id: uuidSchema,
  method: z.string(),
  bean_amount: z.number(),
  water_amount: z.number(),
  grind_size: nullableTextSchema,
  water_temp: z.number().nullable(),
  brew_time: z.number().int().nullable(),
  rating: z.number().int().min(1).max(5).nullable(),
  memo: nullableTextSchema,
  created_at: isoTimestampSchema,
}).strict().readonly();

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const shelfItemSchema = ownedRowSchema.extend({
  roaster_name: z.string(),
  bean_name: z.string(),
  origin: nullableTextSchema,
  roast_date: dateSchema.nullable(),
  opened_date: dateSchema.nullable(),
  total_weight: z.number().int().positive(),
  fill_level: z.number().int().min(0).max(100),
  is_finished: z.boolean(),
  tasting_card_id: uuidSchema.nullable(),
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
}).strict().readonly();

const brewingLogSchema = ownedRowSchema.extend({
  shelf_item_id: uuidSchema.nullable(),
  brewed_at: isoTimestampSchema,
  method: z.string(),
  parameters: z.record(z.unknown()).readonly(),
  rating: z.number().int().min(1).max(5).nullable(),
  simple_note: nullableTextSchema,
  created_at: isoTimestampSchema,
  updated_at: isoTimestampSchema,
}).strict().readonly();

const exportArchiveSchema = z.object({
  version: z.literal("1"),
  exportedAt: isoTimestampSchema,
  tastingCards: z.array(coffeeDexExportMemorySchema).readonly(),
  brewingNotes: z.array(brewingNoteSchema).readonly(),
  shelfItems: z.array(shelfItemSchema).readonly(),
  brewingLogs: z.array(brewingLogSchema).readonly(),
}).strict().readonly();

type ExportArchive = z.infer<typeof exportArchiveSchema>;
type ExportMemory = z.infer<typeof coffeeDexExportMemorySchema>;

function flattenMemory(memory: ExportMemory) {
  const { footer_meta: footerMeta, ...fields } = memory;
  return {
    ...fields,
    footer_origin: footerMeta.origin ?? null,
    footer_date: footerMeta.date ?? null,
    footer_extra_info: footerMeta.extraInfo ?? null,
  };
}

function parseArchive(input: unknown) {
  const archive = exportArchiveSchema.parse(input);
  return {
    ...archive,
    tastingCards: archive.tastingCards.map(flattenMemory),
  };
}

export const coffeeDexExportHeaders = [
  "export_version", "exported_at", "record_type", "id", "user_id",
  "category", "title", "subtitle", "image_url", "badges", "metric1", "metric2", "metric3", "metric4", "metric5", "metric6",
  "tags", "ai_description", "footer_origin", "footer_date", "footer_extra_info",
  "package_origin", "package_process", "repurchase_intent", "repurchase_reasons",
  "scan_source", "scan_confidence", "corrected_fields", "confirmed_at", "is_public",
  "public_share_token", "tasting_card_id", "method", "bean_amount", "water_amount",
  "grind_size", "water_temp", "brew_time", "rating", "memo", "roaster_name", "bean_name",
  "origin", "roast_date", "opened_date", "total_weight", "fill_level", "is_finished",
  "shelf_item_id", "brewed_at", "parameters", "simple_note", "created_at", "updated_at",
] as const;

type CsvRecord = Readonly<Record<string, unknown>>;

function toCsvRecords(archive: ReturnType<typeof parseArchive>): readonly CsvRecord[] {
  const metadata = { export_version: archive.version, exported_at: archive.exportedAt };
  return [
    ...archive.tastingCards.map((row) => ({ ...metadata, record_type: "tasting_card", ...row })),
    ...archive.brewingNotes.map((row) => ({ ...metadata, record_type: "brewing_note", ...row })),
    ...archive.shelfItems.map((row) => ({ ...metadata, record_type: "shelf_item", ...row })),
    ...archive.brewingLogs.map((row) => ({ ...metadata, record_type: "brewing_log", ...row })),
  ];
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  const neutralized = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(neutralized) ? `"${neutralized.replaceAll('"', '""')}"` : neutralized;
}

export function serializeCoffeeDexJson(input: unknown): string {
  return `${JSON.stringify(parseArchive(input), null, 2)}\n`;
}

export function serializeCoffeeDexCsv(input: unknown): string {
  const rows = toCsvRecords(parseArchive(input)).map((row) =>
    coffeeDexExportHeaders.map((header) => csvCell(row[header])).join(","));
  return `${coffeeDexExportHeaders.join(",")}\r\n${rows.map((row) => `${row}\r\n`).join("")}`;
}
