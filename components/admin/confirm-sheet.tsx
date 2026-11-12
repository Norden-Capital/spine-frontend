"use client";

import { BottomSheet, SpButton } from "@/components/spine-ui";

/**
 * "Are you sure?" bottom sheet: main button + Cancel. Destructive = red
 * text on a light red fill (never a full red button). While busy, it
 * can't be closed. An error (e.g. the server said no) shows inside the sheet.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  text,
  confirm,
  destructive,
  busy,
  busyLabel = "Please wait…",
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  text: string;
  confirm: string;
  destructive?: boolean;
  busy: boolean;
  busyLabel?: string;
  /** Shown in the sheet, above the buttons. */
  error?: string | null;
  onConfirm: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return;
        onOpenChange(next);
      }}
      title={title}
      description={text}
      footer={
        <div className="space-y-[8px]">
          <SpButton
            className="w-full"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirm}
          </SpButton>
          <SpButton className="w-full" variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </SpButton>
        </div>
      }
    >
      {error ? (
        <p role="alert" className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      ) : (
        <span />
      )}
    </BottomSheet>
  );
}
