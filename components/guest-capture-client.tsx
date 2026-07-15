"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Coffee, Keyboard, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { CoffeeMemoryEditor } from "@/components/coffee-memory-editor";
import { FigmaDashboardShell } from "@/components/figma-dashboard-shell";
import { Button } from "@/components/ui/button";
import { buildAuthGateHref } from "@/lib/auth-redirect";
import {
  clearGuestDraft,
  createGuestDraft,
  loadGuestDraft,
  saveGuestDraft,
  type GuestDraft,
  type GuestDraftCorrections,
  type GuestDraftExtractedFields,
} from "@/lib/guest-draft";
import { scanResultSchema, type ScanResult } from "@/lib/guest-scan";
import { isTasteProfileKey, tasteProfilePresetByKey } from "@/lib/taste-profile";

const scanEnvelopeSchema = z.object({ data: scanResultSchema }).passthrough();
const errorEnvelopeSchema = z.object({ error: z.object({ message: z.string() }) }).passthrough();
const emptyExtracted: GuestDraftExtractedFields = {
  title: "", subtitle: "", package_origin: null, package_process: null, tags: [], scan_source: "manual", scan_confidence: null,
};
const emptyCorrections: GuestDraftCorrections = {
  title: "", subtitle: "", package_origin: null, package_process: null, tags: [], raw_note: "", acidity: 3, sweetness: 3, body: 3,
  repurchase_intent: "undecided", repurchase_reasons: [], corrected_fields: [],
};

type CaptureActivation = {
  readonly enabled: boolean;
  readonly source: "onboarding" | "public_card" | null;
  readonly tasteProfile: string | null;
};

function readCaptureActivation(): CaptureActivation {
  if (typeof globalThis.location === "undefined") {
    return { enabled: false, source: null, tasteProfile: null };
  }
  const searchParams = new URLSearchParams(globalThis.location.search);
  const intent = searchParams.get("intent");
  const source = searchParams.get("source");
  const tasteProfile = searchParams.get("taste_profile");
  return {
    enabled: intent === "first_card",
    source: source === "onboarding" || source === "public_card" ? source : null,
    tasteProfile,
  };
}

function correctionsFromActivation(activation: CaptureActivation): GuestDraftCorrections {
  if (!isTasteProfileKey(activation.tasteProfile)) return emptyCorrections;
  const preset = tasteProfilePresetByKey[activation.tasteProfile];
  return {
    ...emptyCorrections,
    acidity: preset.formDefaults.metric1,
    sweetness: preset.formDefaults.metric2,
    body: preset.formDefaults.metric3,
    tags: [...preset.formDefaults.tags],
    raw_note: preset.formDefaults.rawNote,
  };
}

function activationCopy(activation: CaptureActivation): string | null {
  if (!activation.enabled) return null;
  if (activation.source === "public_card") return "방금 본 커피처럼 빠른 기록을 시작해요";
  if (isTasteProfileKey(activation.tasteProfile)) {
    return `${tasteProfilePresetByKey[activation.tasteProfile].label}으로 빠른 기록을 시작해요`;
  }
  return "좋았던 원두를 20초 만에 남겨요";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("이미지를 읽지 못했습니다.")));
    reader.addEventListener("error", () => reject(new Error("이미지를 읽지 못했습니다.")));
    reader.readAsDataURL(file);
  });
}

async function readResponseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return {};
    throw error;
  }
}

function responseMessage(json: unknown, fallback: string): string {
  const parsed = errorEnvelopeSchema.safeParse(json);
  return parsed.success ? parsed.data.error.message : fallback;
}

function scanConfidence(result: Extract<ScanResult, { kind: "success" }>): number | null {
  const values = Object.values(result.uncertainty).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return 1 - values.reduce((sum, value) => sum + value, 0) / values.length;
}

function extractedFromScan(result: Extract<ScanResult, { kind: "success" }>): GuestDraftExtractedFields {
  return {
    title: result.title ?? "",
    subtitle: result.subtitle ?? "",
    package_origin: result.origin,
    package_process: result.process,
    tags: result.tags ?? [],
    scan_source: result.source,
    scan_confidence: scanConfidence(result),
  };
}

function correctedFields(extracted: GuestDraftExtractedFields, value: GuestDraftCorrections): GuestDraftCorrections["corrected_fields"] {
  const fields: GuestDraftCorrections["corrected_fields"][number][] = [];
  if (extracted.title !== value.title) fields.push("title");
  if (extracted.subtitle !== value.subtitle) fields.push("subtitle");
  if (extracted.package_origin !== value.package_origin) fields.push("package_origin");
  if (extracted.package_process !== value.package_process) fields.push("package_process");
  if (JSON.stringify(extracted.tags) !== JSON.stringify(value.tags)) fields.push("tags");
  return fields;
}

function requestBody(draft: GuestDraft) {
  const { extracted, corrections } = draft;
  return {
    category: "coffee", title: corrections.title, subtitle: corrections.subtitle, imageUrl: null, badges: [],
    metric1: corrections.acidity, metric2: corrections.sweetness, metric3: corrections.body, tags: corrections.tags,
    aiDescription: corrections.raw_note, footerMeta: { origin: corrections.package_origin ?? undefined },
    packageOrigin: corrections.package_origin, packageProcess: corrections.package_process,
    repurchaseIntent: corrections.repurchase_intent, repurchaseReasons: corrections.repurchase_reasons,
    scanSource: extracted.scan_source, scanConfidence: extracted.scan_confidence,
    correctedFields: corrections.corrected_fields, confirmed: true,
  };
}

export function GuestCaptureClient() {
  const [activation, setActivation] = useState<CaptureActivation>({ enabled: false, source: null, tasteProfile: null });
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<GuestDraftExtractedFields>(emptyExtracted);
  const [corrections, setCorrections] = useState<GuestDraftCorrections>(emptyCorrections);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [hasUncertainFacts, setHasUncertainFacts] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitDraft = useCallback(async (draft: GuestDraft): Promise<void> => {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/v1/cards", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody(draft)),
      });
      const json = await readResponseJson(response);
      if (response.status === 401) {
        globalThis.location.assign(buildAuthGateHref("/capture?resume=1"));
        return;
      }
      if (response.status !== 201) {
        setRetrying(true);
        setMessage(responseMessage(json, "저장하지 못했습니다. 초안은 그대로 보관했어요."));
        return;
      }
      clearGuestDraft(globalThis.localStorage);
      globalThis.sessionStorage.removeItem("coffeedex.guest-resume-submitted");
      globalThis.location.assign("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setRetrying(true);
        setMessage("네트워크에 연결하지 못했습니다. 초안은 그대로 보관했어요.");
        return;
      }
      throw error;
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    const nextActivation = readCaptureActivation();
    setActivation(nextActivation);
    if (nextActivation.enabled) {
      setCorrections(correctionsFromActivation(nextActivation));
      setEditing(true);
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(globalThis.location.search).get("resume") !== "1") return;
    if (globalThis.sessionStorage.getItem("coffeedex.guest-resume-submitted") === "1") return;
    const draft = loadGuestDraft(globalThis.localStorage);
    if (!draft) {
      setMessage("이어갈 초안을 찾지 못했습니다. 새 기록을 시작해주세요.");
      return;
    }
    globalThis.sessionStorage.setItem("coffeedex.guest-resume-submitted", "1");
    setExtracted(draft.extracted);
    setCorrections(draft.corrections);
    setEditing(true);
    setConfirmed(true);
    void submitDraft(draft);
  }, [submitDraft]);

  const beginManualEntry = (): void => {
    setExtracted(emptyExtracted);
    setCorrections(emptyCorrections);
    setEditing(true);
    setMessage(null);
    setHasUncertainFacts(false);
  };

  const runScan = async (): Promise<void> => {
    if (!file) {
      setMessage("먼저 원두 패키지 사진을 선택해주세요.");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const image = await readFileAsDataUrl(file);
      const response = await fetch("/api/v1/cards/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
      const json = await readResponseJson(response);
      if (!response.ok) {
        setMessage(responseMessage(json, "라벨을 읽지 못했습니다. 직접 입력해주세요."));
        return;
      }
      const parsed = scanEnvelopeSchema.safeParse(json);
      if (!parsed.success || parsed.data.data.kind === "unavailable") {
        beginManualEntry();
        setMessage("지금은 라벨을 읽을 수 없어 직접 입력으로 열었어요.");
        return;
      }
      const nextExtracted = extractedFromScan(parsed.data.data);
      setExtracted(nextExtracted);
      setCorrections({
        ...emptyCorrections,
        title: nextExtracted.title,
        subtitle: nextExtracted.subtitle,
        package_origin: nextExtracted.package_origin,
        package_process: nextExtracted.package_process,
        tags: nextExtracted.tags,
      });
      setHasUncertainFacts(Object.values(parsed.data.data.uncertainty).some((value) => value !== null && value >= 0.3));
      setEditing(true);
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
        return;
      }
      throw error;
    } finally {
      setPending(false);
    }
  };

  const save = (): void => {
    const draft = createGuestDraft({ extracted, corrections: { ...corrections, corrected_fields: correctedFields(extracted, corrections) } });
    if (!saveGuestDraft(globalThis.localStorage, draft)) {
      setMessage("이 브라우저에 초안을 보관할 수 없습니다. 저장 공간 설정을 확인해주세요.");
      return;
    }
    void submitDraft(draft);
  };

  return (
    <FigmaDashboardShell
      activeHref="/capture"
      actions={<span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface-strong)] text-[var(--accent-foreground)]"><Coffee size={18} aria-hidden="true" /></span>}
      description="로그인 없이 빠른 비공개 기록을 시작하고, 내 CoffeeDex에 저장할 때만 계정이 필요합니다. 사진 원본은 저장하지 않아요."
      eyebrow="Quick Private Record"
      title="다시 살 원두를 20초 만에 남겨요"
    >
      <div className="mx-auto w-full max-w-3xl">
        <section className="dashboard-panel mb-5 p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C58948]">Quick Private Record</p>
          <h2 className="mt-3 break-keep text-2xl font-black leading-tight sm:text-3xl">새 Rebuy Memory 시작</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">사진 기록으로 먼저 채우거나, 바로 내 문장으로 입력해 다시 살 단서를 남길 수 있어요.</p>
          {activationCopy(activation) && (
            <p className="mt-4 rounded-2xl border border-[#C58948]/30 bg-[#C58948]/10 px-4 py-3 text-sm font-bold text-foreground">
              {activationCopy(activation)}
            </p>
          )}
          {corrections.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {corrections.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#C58948]/30 px-3 py-1 text-xs font-bold text-[#DFA857]">{tag}</span>
              ))}
            </div>
          )}
          {!editing && (
            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold focus-within:ring-4 focus-within:ring-[#C58948]/30">
                <Camera size={18} aria-hidden="true" />
                <span className="min-w-0 truncate">{file?.name ?? "원두 패키지 사진 선택"}</span>
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="원두 패키지 사진 선택" onChange={(event) => setFile(event.target.files?.item(0) ?? null)} />
              </label>
              <Button className="min-h-12 rounded-xl bg-[#C58948] px-5 text-[#19140F]" disabled={pending} onClick={() => void runScan()}>{pending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}라벨 읽기</Button>
              <Button className="min-h-12 rounded-xl border-[var(--border)] sm:col-span-2" variant="outline" onClick={beginManualEntry}><Keyboard size={18} aria-hidden="true" />사진 없이 직접 입력</Button>
            </div>
          )}
        </section>
        {message && <p role="alert" className="mb-5 rounded-xl border border-[#DFA857]/40 bg-[#DFA857]/10 px-4 py-3 text-sm font-semibold leading-6 text-foreground">{message}</p>}
        {editing && <CoffeeMemoryEditor value={corrections} hasUncertainFacts={hasUncertainFacts} confirmed={confirmed} pending={pending} retrying={retrying} onChange={(value) => { setCorrections(value); setConfirmed(false); }} onConfirmChange={setConfirmed} onSave={save} />}
      </div>
    </FigmaDashboardShell>
  );
}
