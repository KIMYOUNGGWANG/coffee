"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, ShieldAlert, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account-deletion";

const apiErrorSchema = z
  .object({
    error: z.object({ message: z.string() }),
  })
  .readonly();

async function readApiError(response: Response): Promise<string> {
  try {
    const result = apiErrorSchema.safeParse(await response.json());
    return result.success ? result.data.error.message : "계정 삭제를 완료하지 못했습니다. 다시 시도해주세요.";
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return "계정 삭제를 완료하지 못했습니다. 다시 시도해주세요.";
    }
    throw error;
  }
}

export function AccountDataControls() {
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDeletionReady = confirmation === ACCOUNT_DELETION_CONFIRMATION && acknowledged;

  async function deleteAccount(): Promise<void> {
    if (!isDeletionReady || isDeleting || isDeleted) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/v1/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: ACCOUNT_DELETION_CONFIRMATION,
          acknowledgePermanentDeletion: true,
        }),
      });

      if (!response.ok) {
        setErrorMessage(await readApiError(response));
        return;
      }

      setIsDeleted(true);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? "네트워크 오류로 계정을 삭제하지 못했습니다. 연결을 확인하고 다시 시도해주세요."
          : "계정 삭제를 완료하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <section className="dashboard-panel p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary-amber/25 bg-primary-amber/10 text-primary-amber">
            <Download aria-hidden="true" size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary-amber">내 데이터</p>
            <h2 className="mt-1 break-keep font-serif text-2xl font-black leading-tight">커피 기억 내려받기</h2>
          </div>
        </div>

        <p className="mt-4 break-keep text-sm leading-6 text-muted-foreground">
          요금제와 관계없이 저장한 커피 기억을 언제든 내려받을 수 있습니다.
        </p>

        <div className="mt-6 grid gap-3">
          <a
            href="/api/v1/export?format=json"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-amber px-4 text-sm font-extrabold text-background-dark transition-[opacity,transform] hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
          >
            <FileJson aria-hidden="true" size={18} />
            JSON 내려받기
          </a>
          <a
            href="/api/v1/export?format=csv"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-extrabold text-foreground transition-[background-color,transform] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] active:scale-[0.98]"
          >
            <FileSpreadsheet aria-hidden="true" size={18} />
            CSV 내려받기
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-[color:var(--danger)]/35 bg-[color:var(--danger)]/[0.06] p-5 shadow-[0_18px_50px_rgba(73,48,36,0.08)] sm:p-6" aria-labelledby="delete-account-title">
        <div className="grid gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color:var(--danger)]/15 text-[color:var(--danger)]">
            <ShieldAlert aria-hidden="true" size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[color:var(--danger)]">위험 영역</p>
            <h2 id="delete-account-title" className="mt-1 break-keep font-serif text-2xl font-black leading-tight">계정 영구 삭제</h2>
          </div>
        </div>

        <p className="mt-4 break-keep text-sm leading-6 text-muted-foreground">
          커피 기록과 계정 정보가 영구 삭제되며 되돌릴 수 없습니다. 로그아웃과는 별개의 작업입니다.
        </p>

        <div className="mt-5 rounded-2xl border border-[color:var(--danger)]/20 bg-[color:var(--surface)]/70 p-4">
          <label htmlFor="account-deletion-confirmation" className="block text-sm font-bold">
            아래 확인 문구를 정확히 입력하세요.
          </label>
          <code className="mt-2 block break-all rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-primary-amber">
            {ACCOUNT_DELETION_CONFIRMATION}
          </code>
          <input
            id="account-deletion-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={isDeleted}
            autoComplete="off"
            className="mt-3 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-base text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary-amber focus:ring-4 focus:ring-[var(--ring)] disabled:opacity-60"
            placeholder="확인 문구 입력"
          />

          <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-foreground">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              disabled={isDeleted}
              className="mt-1 size-5 shrink-0 accent-[var(--danger)]"
            />
            <span>모든 데이터가 영구 삭제되며 복구할 수 없음을 이해했습니다.</span>
          </label>
        </div>

        {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--surface)]/70 px-4 py-3 text-sm text-foreground">{errorMessage}</p>}
        {isDeleted && <p role="status" className="mt-4 rounded-xl border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 px-4 py-3 text-sm text-foreground">계정 삭제가 완료되었습니다.</p>}

        <Button
          type="button"
          onClick={deleteAccount}
          disabled={!isDeletionReady || isDeleting || isDeleted}
          className="mt-5 min-h-12 w-full rounded-xl bg-[color:var(--danger)] font-extrabold text-white hover:bg-[color:var(--danger)] hover:opacity-90 focus-visible:ring-[var(--ring)]"
        >
          <Trash2 aria-hidden="true" size={18} />
          {isDeleting ? "삭제 중..." : isDeleted ? "삭제 완료" : "계정 영구 삭제"}
        </Button>
      </section>
    </div>
  );
}
