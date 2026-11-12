"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpButton } from "@/components/spine-ui";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { useDates } from "@/components/prefs/prefs-provider";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * "Skip this time" (the owner): POST /api/admin/recurring/occurrences/{id}/skip.
 * Asks first. After it, the page reloads its data.
 */
export function SkipOccurrence({
  id,
  dueDate,
  size = "md",
  className,
  onDone,
}: {
  id: string;
  dueDate: string;
  size?: "md" | "lg";
  className?: string;
  /** Called with a short text after a skip (or an error text). */
  onDone?: (notice: { kind: "ok" | "error"; text: string }) => void;
}) {
  const router = useRouter();
  const dates = useDates();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function skip() {
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/recurring/occurrences/${encodeURIComponent(id)}/skip`, { method: "POST" });
      onDone?.({ kind: "ok", text: "Skipped this time. The next reminder still comes." });
    } catch (err) {
      const text = errorMessage(err);
      if (onDone) onDone({ kind: "error", text });
      else setError(text);
    } finally {
      setBusy(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <SpButton
        variant="secondary"
        size={size}
        className={cn(className)}
        onClick={() => setOpen(true)}
        data-testid="recurring-skip"
      >
        Skip this time
      </SpButton>
      {error && (
        <p role="alert" className="col-span-full px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      )}
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title="Skip this time?"
        text={`No expense is added for ${dates.day(dueDate)}. The next reminder still comes.`}
        confirm="Skip this time"
        busy={busy}
        busyLabel="Skipping…"
        onConfirm={() => void skip()}
      />
    </>
  );
}
