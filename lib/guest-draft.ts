import { z } from "zod";

export const GUEST_DRAFT_STORAGE_KEY = "coffeedex.guest-draft" as const;
export const GUEST_DRAFT_TTL_MS = 24 * 60 * 60 * 1_000;

const guestDraftVersion = 1 as const;
function draftTextSchema(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .refine((value) => !/^data:image\/[^;]+;base64,/i.test(value), "Image data is not draft text.");
}

const optionalPackageClaimSchema = draftTextSchema(160).nullable();
const tagsSchema = z.array(draftTextSchema(80)).max(12).readonly();
const correctedFieldsSchema = z
  .array(z.enum(["title", "subtitle", "package_origin", "package_process", "tags"]))
  .max(5)
  .readonly();

export const guestDraftExtractedFieldsSchema = z
  .object({
    title: draftTextSchema(160),
    subtitle: draftTextSchema(160),
    package_origin: optionalPackageClaimSchema,
    package_process: optionalPackageClaimSchema,
    tags: tagsSchema,
    scan_source: z.enum(["gemini", "manual"]).nullable(),
    scan_confidence: z.number().min(0).max(1).nullable(),
  })
  .strict()
  .readonly();

export const guestDraftCorrectionsSchema = z
  .object({
    title: draftTextSchema(160),
    subtitle: draftTextSchema(160),
    package_origin: optionalPackageClaimSchema,
    package_process: optionalPackageClaimSchema,
    tags: tagsSchema,
    raw_note: draftTextSchema(2_000),
    acidity: z.number().int().min(1).max(5),
    sweetness: z.number().int().min(1).max(5),
    body: z.number().int().min(1).max(5),
    repurchase_intent: z.enum(["again", "maybe", "no", "undecided"]),
    repurchase_reasons: z.array(draftTextSchema(80).refine((value) => value.length > 0)).max(8).readonly(),
    corrected_fields: correctedFieldsSchema,
  })
  .strict()
  .readonly();

const guestDraftInputShape = {
  extracted: guestDraftExtractedFieldsSchema,
  corrections: guestDraftCorrectionsSchema,
} as const;

export const guestDraftInputSchema = z
  .object(guestDraftInputShape)
  .strict()
  .readonly();

export const guestDraftSchema = z
  .object({
    ...guestDraftInputShape,
    version: z.literal(guestDraftVersion),
    created_at: z.string().datetime({ offset: true }),
  })
  .strict()
  .readonly();

export type GuestDraftExtractedFields = z.infer<typeof guestDraftExtractedFieldsSchema>;
export type GuestDraftCorrections = z.infer<typeof guestDraftCorrectionsSchema>;
export type GuestDraftInput = z.infer<typeof guestDraftInputSchema>;
export type GuestDraft = z.infer<typeof guestDraftSchema>;

export interface GuestDraftStorage {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
}

export function createGuestDraft(input: GuestDraftInput, now = new Date()): GuestDraft {
  return guestDraftSchema.parse({
    ...guestDraftInputSchema.parse(input),
    version: guestDraftVersion,
    created_at: now.toISOString(),
  });
}

export function saveGuestDraft(storage: GuestDraftStorage, draft: GuestDraft): boolean {
  const parsedDraft = guestDraftSchema.safeParse(draft);
  if (!parsedDraft.success) {
    return false;
  }

  try {
    storage.setItem(GUEST_DRAFT_STORAGE_KEY, JSON.stringify(parsedDraft.data));
    return true;
  } catch (error) {
    if (error instanceof Error) {
      return false;
    }
    throw error;
  }
}

export function clearGuestDraft(storage: GuestDraftStorage): boolean {
  try {
    storage.removeItem(GUEST_DRAFT_STORAGE_KEY);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      return false;
    }
    throw error;
  }
}

export function loadGuestDraft(storage: GuestDraftStorage, now = new Date()): GuestDraft | null {
  let storedValue: string | null;
  try {
    storedValue = storage.getItem(GUEST_DRAFT_STORAGE_KEY);
  } catch (error) {
    if (error instanceof Error) {
      return null;
    }
    throw error;
  }

  if (storedValue === null) {
    return null;
  }

  let untrustedDraft: unknown;
  try {
    untrustedDraft = JSON.parse(storedValue);
  } catch (error) {
    if (error instanceof SyntaxError) {
      clearGuestDraft(storage);
      return null;
    }
    throw error;
  }

  const parsedDraft = guestDraftSchema.safeParse(untrustedDraft);
  if (!parsedDraft.success) {
    clearGuestDraft(storage);
    return null;
  }

  const createdAt = Date.parse(parsedDraft.data.created_at);
  const draftAge = now.getTime() - createdAt;
  if (draftAge < 0 || draftAge >= GUEST_DRAFT_TTL_MS) {
    clearGuestDraft(storage);
    return null;
  }

  return parsedDraft.data;
}
