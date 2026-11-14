"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyWalletAdd } from "iconsax-react";
import { AddPill, AmountField, BottomSheet, DateField, IconEdit, IconReceipt, SpButton, SpField, SpInput } from "@/components/spine-ui";
import { api, ApiError, errorMessage, fieldErrorText } from "@/lib/api";
import { useDates } from "@/components/prefs/prefs-provider";
import { ProofPicker, type ProofItem } from "@/components/transactions/proof-picker";
import { aboutDay, balanceAdminPath, guessEmptyDate, type Balance } from "@/lib/balances-types";
import { formatMoney } from "@/lib/transactions-types";
import { BulkIcon } from "./balance-parts";

const MONEY_ICON = <span className="text-[1rem] font-medium text-(--sp-text-muted)">$</span>;

/** "12", "12.5", "1 234,50" → "12.50"; 0 allowed when `zero`; null = not a number. */
function money(raw: string, zero = false): string | null {
  const cleaned = raw.trim().replace(/[\s ']/g, "").replace(",", ".");
  if (!/^\d{1,10}(\.\d{0,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!(n > 0) && !(zero && n === 0)) return null;
  return n.toFixed(2);
}

/** "50" +1 → "60" (steps of 10, never below 0). */
function step(raw: string, delta: 1 | -1): string {
  const n = Number((raw || "0").replace(",", ".")) || 0;
  return String(Math.max(0, Math.round((n + delta * 10) * 100) / 100));
}

/**
 * Hero "Recharge" (owner): a sheet with amount, date and a REQUIRED proof.
 * Saves a new start point (guess + amount) and one company expense.
 */
export function RechargeButton({ b, today, categoryText }: { b: Balance; today: string; categoryText: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(() => {
    const cut = Number(b.cut);
    const start = Number(b.startAmount);
    return String(start > 0 ? start : cut > 0 ? cut : 10);
  });
  const [day, setDay] = useState<string | null>(today);
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = money(amount);
  const done = proofs.filter((p) => p.status === "done" && p.ref);
  const uploading = proofs.some((p) => p.status === "uploading");
  const ready = !!value && !!day && done.length > 0 && !uploading;
  const guess = Number(b.guess);
  const after = guess + (value ? Number(value) : 0);

  function reset() {
    setProofs([]);
    setError(null);
    setDay(today);
  }

  async function save() {
    if (!ready || pending) return;
    setPending(true);
    setError(null);
    try {
      await api(`${balanceAdminPath(b.id)}/recharge`, {
        method: "POST",
        body: { amount: value, date: day, fileIds: done.map((p) => p.ref!.id) },
      });
      setPending(false);
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setPending(false);
      setError(err instanceof ApiError && err.status === 400 ? fieldErrorText(err) : errorMessage(err));
    }
  }

  return (
    <>
      <AddPill
        glass
        label="Recharge"
        icon={<BulkIcon icon={EmptyWalletAdd} className="size-[18px]" />}
        onClick={() => setOpen(true)}
        data-testid="balance-recharge"
      />
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next && !pending) {
            setOpen(false);
            reset();
          }
        }}
        title={`Recharge ${b.name}`}
        description={`Now about ${formatMoney(guess)}. After: about ${formatMoney(after)}.`}
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
            <SpButton variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </SpButton>
            <SpButton onClick={save} disabled={!ready || pending} data-testid="recharge-save">
              {pending ? "Saving…" : `Recharge ${formatMoney(value ?? 0)}`}
            </SpButton>
          </div>
        }
      >
        <div className="space-y-[16px]" data-testid="recharge-sheet">
          <AmountField
            id="r-amount"
            label="Amount"
            symbol="$"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onStep={(d) => setAmount((v) => step(v, d))}
            canDecrement={(Number(amount) || 0) >= 10}
          />
          <DateField label="Date" value={day} onChange={setDay} today={today} min={b.startDate} max={today} surface="panel" />
          <div className="space-y-[8px]">
            <p className="px-[4px] text-[0.8125rem] leading-snug font-medium text-(--sp-text)">Proof</p>
            <ProofPicker items={proofs} onChange={setProofs} surface="panel" />
            {/* The picker already says what a proof is; only say why Recharge is off. */}
            {done.length === 0 && (
              <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
                Required. Recharge turns on once a proof is added.
              </p>
            )}
          </div>
          <div className="flex gap-[10px] rounded-[16px] bg-[color-mix(in_oklab,var(--sp-card-front)_12%,var(--sp-panel))] px-[14px] py-[12px]">
            <span className="mt-[1px] text-(--sp-card-front) [&_svg]:size-[18px]">
              <IconReceipt aria-hidden />
            </span>
            <p className="text-[0.75rem] leading-snug text-(--sp-text)">
              A <span className="font-semibold">{formatMoney(value ?? 0)}</span> company expense will be added: {b.name} ·{" "}
              {categoryText}
              {b.website ? ` · ${b.website}` : ""}.
            </p>
          </div>
          {error && (
            <p role="alert" className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)">
              {error}
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  );
}

/** "Fix the real balance" (owner): type what the site shows. No expense is added. */
export function FixButton({ b, today }: { b: Balance; today: string }) {
  const router = useRouter();
  const dates = useDates();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(Number(b.guess).toFixed(2));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = money(amount, true);
  const empty = value !== null ? guessEmptyDate(Number(value), Number(b.cut), b.nextCut, b.unit, b.every, today) : null;

  async function save() {
    if (value === null || pending) return;
    setPending(true);
    setError(null);
    try {
      await api(`${balanceAdminPath(b.id)}/fix`, { method: "POST", body: { amount: value } });
      setPending(false);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setPending(false);
      setError(err instanceof ApiError && err.status === 400 ? fieldErrorText(err) : errorMessage(err));
    }
  }

  return (
    <>
      <SpButton
        variant="secondary"
        className="w-full"
        icon={<IconEdit aria-hidden />}
        onClick={() => {
          setAmount(Number(b.guess).toFixed(2));
          setError(null);
          setOpen(true);
        }}
        data-testid="balance-fix"
      >
        Fix the real balance
      </SpButton>
      <BottomSheet
        open={open}
        onOpenChange={(next) => !next && !pending && setOpen(false)}
        title="Fix the real balance"
        description={`Spine guessed ${formatMoney(b.guess)}. Type what the site shows.`}
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
            <SpButton variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </SpButton>
            <SpButton onClick={save} disabled={value === null || pending} data-testid="fix-save">
              {pending ? "Saving…" : `Save ${formatMoney(value ?? 0)}`}
            </SpButton>
          </div>
        }
      >
        <div className="space-y-[16px]" data-testid="fix-sheet">
          <SpField
            label="Real balance"
            htmlFor="fix-amount"
            error={amount.trim() !== "" && value === null ? "Please type an amount, like 38.90." : undefined}
          >
            <SpInput
              id="fix-amount"
              icon={MONEY_ICON}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="tabular-nums"
            />
          </SpField>
          <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[12px] text-[0.75rem] leading-snug text-(--sp-text-2)">
            No expense is added. The guess starts again from {formatMoney(value ?? 0)}
            {empty ? ` and the new empty date is ${aboutDay(empty, { today, dateFormat: dates.settings.dateFormat })}` : ""}.
          </p>
          {error && (
            <p role="alert" className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)">
              {error}
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
