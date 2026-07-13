import { z } from "zod";

export const repurchaseIntents = ["again", "maybe", "no", "undecided"] as const;
export const scanSources = ["gemini", "manual"] as const;
export const correctableCoffeeFields = [
  "title",
  "subtitle",
  "package_origin",
  "package_process",
  "tags",
] as const;

export const repurchaseIntentSchema = z.enum(repurchaseIntents);
export const scanSourceSchema = z.enum(scanSources);
export const correctableCoffeeFieldSchema = z.enum(correctableCoffeeFields);

export function hasMeaningfulCoffeeMemoryText(value: string | null | undefined): value is string {
  return typeof value === "string" && /[^\s\p{Default_Ignorable_Code_Point}]/u.test(value);
}

export function normalizeCoffeeMemoryText(value: string): string {
  const trimmed = value.trim();
  return hasMeaningfulCoffeeMemoryText(trimmed) ? trimmed : "";
}

export const repurchaseReasonSchema = z.string().trim().min(1).max(80);
export const purchaseUrlSchema = z.string().trim().url().max(500).nullable().default(null);
export const purchaseNoteSchema = z.string().trim().min(1).max(160).nullable().default(null);
export const repurchaseReasonInputSchema = z.string().trim().max(80).refine(hasMeaningfulCoffeeMemoryText, "다시 살 이유를 입력해주세요.");
export const purchaseNoteInputSchema = z.string().trim().max(160).refine(hasMeaningfulCoffeeMemoryText, "구매처 또는 가격 메모를 입력해주세요.").nullable();

const packageClaimSchema = z.string().trim().min(1).max(160).nullable().default(null);
const repurchaseReasonsSchema = z
  .array(repurchaseReasonSchema)
  .max(8)
  .readonly()
  .default([]);
const correctedFieldsSchema = z
  .array(correctableCoffeeFieldSchema)
  .max(correctableCoffeeFields.length)
  .readonly()
  .default([]);

export const packageClaimsSchema = z
  .object({
    package_origin: packageClaimSchema,
    package_process: packageClaimSchema,
  })
  .strict()
  .readonly();

export const scanProvenanceSchema = z
  .object({
    scan_source: scanSourceSchema.nullable().default(null),
    scan_confidence: z.number().min(0).max(1).nullable().default(null),
    corrected_fields: correctedFieldsSchema,
  })
  .strict()
  .readonly();

export const coffeeMemorySchema = z
  .object({
    package_origin: packageClaimSchema,
    package_process: packageClaimSchema,
    purchase_url: purchaseUrlSchema,
    purchase_note: purchaseNoteSchema,
    repurchase_intent: repurchaseIntentSchema.default("undecided"),
    repurchase_reasons: repurchaseReasonsSchema,
    scan_source: scanSourceSchema.nullable().default(null),
    scan_confidence: z.number().min(0).max(1).nullable().default(null),
    corrected_fields: correctedFieldsSchema,
    confirmed_at: z.string().datetime({ offset: true }).nullable().default(null),
  })
  .strict()
  .readonly();

export type RepurchaseIntent = z.infer<typeof repurchaseIntentSchema>;
export type ScanSource = z.infer<typeof scanSourceSchema>;
export type CorrectableCoffeeField = z.infer<typeof correctableCoffeeFieldSchema>;
export type PackageClaims = z.infer<typeof packageClaimsSchema>;
export type ScanProvenance = z.infer<typeof scanProvenanceSchema>;
export type CoffeeMemory = z.infer<typeof coffeeMemorySchema>;
