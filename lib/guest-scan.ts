import { z } from "zod";

export const MAX_SCAN_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GUEST_IDENTITIES = 10_000;
const dataUrlPattern = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const scanRequestSchema = z.object({ image: z.string().min(1) }).strict();
const nullableClaimSchema = z.string().trim().min(1).max(160).nullable().default(null);
const nullableUncertaintySchema = z.number().min(0).max(1).nullable().default(null);

export const scanUncertaintySchema = z.object({
  title: nullableUncertaintySchema,
  subtitle: nullableUncertaintySchema,
  origin: nullableUncertaintySchema,
  process: nullableUncertaintySchema,
  tags: nullableUncertaintySchema,
}).strict().readonly();

const providerScanResultShape = {
  title: nullableClaimSchema,
  subtitle: nullableClaimSchema,
  origin: nullableClaimSchema,
  process: nullableClaimSchema,
  tags: z.array(z.string().trim().min(1).max(80)).max(12).nullable().default(null),
  uncertainty: scanUncertaintySchema,
} as const;

export const providerScanResultSchema = z.object(providerScanResultShape).strict().readonly();

export const scanSuccessSchema = z.object({
  ...providerScanResultShape,
  kind: z.literal("success"),
  source: z.literal("gemini"),
}).strict();

export const scanUnavailableSchema = z.object({
  kind: z.literal("unavailable"),
  reason: z.enum(["provider_unconfigured", "provider_error"]),
  manual_entry: z.literal(true),
}).strict();

export const scanResultSchema = z.discriminatedUnion("kind", [
  scanSuccessSchema,
  scanUnavailableSchema,
]).readonly();

export type ScanImage = {
  readonly mimeType: "image/jpeg" | "image/png" | "image/webp";
  readonly base64Data: string;
};

export type ScanRequestResult =
  | { readonly kind: "ready"; readonly image: ScanImage }
  | { readonly kind: "invalid" }
  | { readonly kind: "too_large" };

export type ScanResult = z.infer<typeof scanResultSchema>;

// MVP deployment limitation: this per-process/IP trial bound is not distributed security.
const usedGuestIdentities = new Map<string, true>();

export function parseScanRequest(input: unknown): ScanRequestResult {
  const parsedRequest = scanRequestSchema.safeParse(input);
  if (!parsedRequest.success) {
    return { kind: "invalid" };
  }

  const match = dataUrlPattern.exec(parsedRequest.data.image);
  const mimeSubtype = match?.[1];
  const base64Data = match?.[2];
  if (!mimeSubtype || !base64Data || base64Data.length % 4 !== 0) {
    return { kind: "invalid" };
  }

  const decodedSize = Buffer.from(base64Data, "base64").byteLength;
  if (decodedSize > MAX_SCAN_IMAGE_BYTES) {
    return { kind: "too_large" };
  }

  const canonicalBase64 = Buffer.from(base64Data, "base64").toString("base64");
  if (canonicalBase64 !== base64Data) {
    return { kind: "invalid" };
  }

  const mimeType = z.enum(["image/jpeg", "image/png", "image/webp"])
    .safeParse(`image/${mimeSubtype}`);
  if (!mimeType.success) {
    return { kind: "invalid" };
  }

  const bytes = Buffer.from(base64Data, "base64");
  const signatureMatches: Record<typeof mimeType.data, boolean> = {
    "image/jpeg": bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    "image/png": bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": bytes.subarray(0, 4).toString("ascii") === "RIFF"
      && bytes.subarray(8, 12).toString("ascii") === "WEBP",
  };
  if (!signatureMatches[mimeType.data]) {
    return { kind: "invalid" };
  }

  return { kind: "ready", image: { mimeType: mimeType.data, base64Data } };
}

export function readGuestIdentity(headers: Headers): string {
  const forwardedAddress = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedAddress || headers.get("x-real-ip")?.trim() || "unknown-client";
}

export function reserveGuestScan(identity: string): boolean {
  if (usedGuestIdentities.has(identity)) {
    return false;
  }

  if (usedGuestIdentities.size >= MAX_GUEST_IDENTITIES) {
    const oldestIdentity = usedGuestIdentities.keys().next();
    if (!oldestIdentity.done) {
      usedGuestIdentities.delete(oldestIdentity.value);
    }
  }

  usedGuestIdentities.set(identity, true);
  return true;
}
