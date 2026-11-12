"use client";

import { Copy } from "lucide-react";
import { useDates } from "@/components/prefs/prefs-provider";
import { BottomSheet, SpButton } from "@/components/spine-ui";

export type DuplicateMatch = { id: string; description: string; createdBy: { id: string; name: string }; createdAt: string };

/**
 * 409 possible_duplicate: a transaction with the same type, amount, currency
 * and date already exists. Show the matches; "Save anyway" or "Cancel".
 */
export function DuplicateSheet({
  matches,
  pending,
  onCancel,
  onSaveAnyway,
}: {
  /** null = closed. */
  matches: DuplicateMatch[] | null;
  pending: boolean;
  onCancel: () => void;
  onSaveAnyway: () => void;
}) {
  const dates = useDates();
  const one = matches?.length === 1;
  return (
    <BottomSheet
      open={matches !== null}
      onOpenChange={(open) => !open && !pending && onCancel()}
      title="Already saved?"
      description={`${one ? "This transaction has" : "These transactions have"} the same type, amount, currency and date.`}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <SpButton variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </SpButton>
          <SpButton onClick={onSaveAnyway} disabled={pending}>
            {pending ? "Saving…" : "Save anyway"}
          </SpButton>
        </div>
      }
    >
      <ul className="flex flex-col rounded-(--sp-radius) bg-(--sp-panel) py-2">
        {(matches ?? []).map((m) => (
          <li key={m.id} className="flex items-center gap-[10.8px] px-[14px] py-[7.5px]">
            <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) [&_svg]:size-[15px]">
              <Copy aria-hidden />
            </span>
            <span className="min-w-0 flex-1 leading-none">
              <span className="block truncate text-[12px] font-medium">{m.description || "No description"}</span>
              <span className="mt-[3.9px] block truncate text-[10px] text-(--sp-text-faint)">
                {m.createdBy.name} · {dates.dateTime(m.createdAt)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
