"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, Coffee, Keyboard, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { CoffeeMemoryEditor } from "@/components/coffee-memory-editor";
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

const scanEnvelopeSchema = z.object({ data: scanResultSchema }).passthrough();
const errorEnvelopeSchema = z.object({ error: z.object({ message: z.string() }) }).passthrough();
const emptyExtracted: GuestDraftExtractedFields = {
  title: "", subtitle: "", package_origin: null, package_process: null, tags: [], scan_source: "manual", scan_confidence: null,
};
const emptyCorrections: GuestDraftCorrections = {
  title: "", subtitle: "", package_origin: null, package_process: null, tags: [], raw_note: "", acidity: 3, sweetness: 3, body: 3,
  repurchase_intent: "undecided", repurchase_reasons: [], corrected_fields: [],
};

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
    if (new URLSearchParams(globalThis.location.search).get("resume") !== "1") return;
    const draft = loadGuestDraft(globalThis.localStorage);
    if (!draft) {
      setMessage("이어갈 초안을 찾지 못했습니다. 새 기록을 시작해주세요.");
      return;
    }
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
    <main className="min-h-screen bg-[#1a1a1a] px-4 py-6 text-[#F7F7F4] sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#C58948] text-[#19140F]"><Coffee size={20} aria-hidden="true" /></span><span className="font-serif font-bold">CoffeeDex</span></header>
        <section className="mb-6 rounded-3xl border border-white/10 bg-[#24201c] p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C58948]">Guest-first memory</p>
          <h1 className="mt-3 break-keep font-serif text-3xl font-bold leading-tight sm:text-4xl">오늘 마신 커피를 남겨보세요</h1>
          <p className="mt-3 text-sm leading-6 text-[#F7F7F4]/65">로그인 없이 사진을 읽거나 직접 입력할 수 있어요. 계정은 내 기록에 저장할 때만 필요합니다.</p>
          {!editing && (
            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold focus-within:ring-4 focus-within:ring-[#C58948]/30">
                <Camera size={18} aria-hidden="true" />
                <span className="min-w-0 truncate">{file?.name ?? "원두 패키지 사진 선택"}</span>
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="원두 패키지 사진 선택" onChange={(event) => setFile(event.target.files?.item(0) ?? null)} />
              </label>
              <Button className="min-h-12 rounded-xl bg-[#C58948] px-5 text-[#19140F]" disabled={pending} onClick={() => void runScan()}>{pending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}라벨 읽기</Button>
              <Button className="min-h-12 rounded-xl border-white/15 sm:col-span-2" variant="outline" onClick={beginManualEntry}><Keyboard size={18} aria-hidden="true" />사진 없이 직접 입력</Button>
            </div>
          )}
        </section>
        {message && <p role="alert" className="mb-5 rounded-xl border border-[#DFA857]/40 bg-[#DFA857]/10 px-4 py-3 text-sm leading-6 text-[#F7F7F4]">{message}</p>}
        {editing && <CoffeeMemoryEditor value={corrections} hasUncertainFacts={hasUncertainFacts} confirmed={confirmed} pending={pending} retrying={retrying} onChange={(value) => { setCorrections(value); setConfirmed(false); }} onConfirmChange={setConfirmed} onSave={save} />}
      </div>
    </main>
  );
}
