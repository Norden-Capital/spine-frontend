"use client";

import { Receipt } from "lucide-react";
import { useDates } from "@/components/prefs/prefs-provider";
import { BottomSheet, ListItem, SpButton } from "@/components/spine-ui";
import { formatMoney, type Currency, type TxType } from "@/lib/transactions-types";

export type DuplicateMatch = { id: string; description: string; createdBy: { id: string; name: string }; createdAt: string };

/**
 * 409 possible_duplicate: a transaction with the same type, amount, currency
 * and date already exists. Show the matches; "Save anyway" or "Cancel".
 */
export function DuplicateSheet({
  matches,
  pending,
  type,
  amount,
  currency,
  wallet = false,
  onCancel,
  onSaveAnyway,
}: {
  /** null = closed. */
  matches: DuplicateMatch[] | null;
  pending: boolean;
  /** The amount being saved (the matches have the same one). */
  type: TxType;
  amount: string | null;
  currency: Currency;
  wallet?: boolean;
  onCancel: () => void;
  onSaveAnyway: () => void;
}) {
  const dates = useDates();
  const one = matches?.length === 1;
  const word = type === "INCOME" ? "income" : "expense";
  const shown = amount ? formatMoney(amount, currency, type === "INCOME" ? "+" : undefined) : "";
  return (
    <BottomSheet
      open={matches !== null}
      onOpenChange={(open) => !open && !pending && onCancel()}
      title="Already saved?"
      description={`${one ? `An ${word} with` : `${word[0].toUpperCase()}${word.slice(1)}s with`} the same type, amount, currency and date already ${one ? "exists" : "exist"}${wallet ? " in your wallet" : ""}.`}
      footer={
        <div className="grid grid-cols-2 gap-[8px]">
          <SpButton variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </SpButton>
          <SpButton onClick={onSaveAnyway} disabled={pending}>
            {pending ? "Saving…" : "Save anyway"}
          </SpButton>
        </div>
      }
    >
      <ul className="-mx-[14px] flex flex-col">
        {(matches ?? []).map((m) => (
          <li key={m.id}>
            <ListItem
              icon={<Receipt />}
              title={m.description || "No description"}
              meta={wallet ? dates.dateTime(m.createdAt) : `${m.createdBy.name} • ${dates.dateTime(m.createdAt)}`}
              amount={shown}
              tone={type === "INCOME" ? "income" : "expense"}
            />
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
