"use client";

import { createContext, use, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AddPill, IconLock } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import type { WalletCurrency } from "@/lib/wallet-types";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { BudgetSheet } from "@/components/wallet/budgets-manager";
import { CurrencyFlag } from "@/components/wallet/currency-flag";
import { GoalSheet } from "@/components/wallet/goals-manager";
import { noAutoFaceIdNextTime } from "@/components/wallet/use-wallet-passkey";
import {
  ICON_BUTTON_CLASS,
  QUICK_ACTION_CLASS,
  QUICK_ACTION_ICON_CLASS,
  QUICK_ACTION_LABEL_CLASS,
} from "./home-links";

// Client buttons for the space dashboards (the server pages render them).

type Sheet = "goal" | "budget" | null;
const SheetsContext = createContext<((sheet: Sheet) => void) | null>(null);

/**
 * Wallet dashboard: holds the "Set a goal" / "Set a budget" sheets, so the
 * quick actions and the Savings card pill can open them directly.
 */
export function WalletSheets({
  today,
  categories,
  children,
}: {
  /** My today, "YYYY-MM-DD" (todayIn(zone)). */
  today: string;
  categories: Category[];
  children: ReactNode;
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  return (
    <SheetsContext value={setSheet}>
      {children}
      <GoalSheet open={sheet === "goal"} onOpenChange={(o) => setSheet(o ? "goal" : null)} today={today} />
      <BudgetSheet
        open={sheet === "budget"}
        onOpenChange={(o) => setSheet(o ? "budget" : null)}
        categories={categories}
      />
    </SheetsContext>
  );
}

function useOpenSheet() {
  const open = use(SheetsContext);
  if (!open) throw new Error("Use inside <WalletSheets>");
  return open;
}

/** Quick action (same look as LinkQuickAction) that opens a wallet sheet. */
export function SheetQuickAction({ sheet, label, icon }: { sheet: "goal" | "budget"; label: string; icon: ReactNode }) {
  const open = useOpenSheet();
  return (
    <button
      type="button"
      onClick={() => open(sheet)}
      aria-haspopup="dialog"
      className={QUICK_ACTION_CLASS}
      data-testid={`quick-set-${sheet}`}
    >
      <span className={QUICK_ACTION_ICON_CLASS}>{icon}</span>
      <span className={QUICK_ACTION_LABEL_CLASS}>{label}</span>
    </button>
  );
}

/** Card pill (same look as LinkAddPill) that opens a wallet sheet. */
export function SheetPill({
  sheet,
  label,
  icon,
  glass,
}: {
  sheet: "goal" | "budget";
  label: string;
  icon: ReactNode;
  /** Glass button for glass cards. */
  glass?: boolean;
}) {
  const open = useOpenSheet();
  return (
    <AddPill
      glass={glass}
      label={label}
      icon={icon}
      onClick={() => open(sheet)}
      aria-haspopup="dialog"
      data-testid={`savings-set-${sheet}`}
    />
  );
}

/** Round lock button (page header): locks the wallet now, back to the PIN pad. */
export function LockWalletIconButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      aria-label="Lock wallet"
      disabled={pending}
      className={ICON_BUTTON_CLASS}
      data-testid="wallet-lock"
      onClick={() => {
        setPending(true);
        noAutoFaceIdNextTime();
        void api("/wallet/lock", { method: "POST" })
          .catch(() => {})
          .finally(() => router.refresh());
      }}
    >
      <IconLock aria-hidden />
    </button>
  );
}

/**
 * Wallet header pill: flag + the currency the totals are in ("MAD" / "USD").
 * A tap makes the other one my default (Settings › Preferences) and reloads,
 * so the totals show in it.
 */
export function WalletCurrencyPill({ currency }: { currency: WalletCurrency }) {
  const router = useRouter();
  const { prefs, setPrefs } = usePrefs();
  const [target, setTarget] = useState<WalletCurrency | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Show the new one at once, until the fresh page comes.
  const shown = (saving || refreshing) && target ? target : currency;
  const other: WalletCurrency = shown === "MAD" ? "USD" : "MAD";

  async function toggle() {
    const before = prefs;
    const next = { ...prefs, walletCurrency: other };
    setTarget(other);
    setSaving(true);
    setError(null);
    setPrefs(next);
    try {
      await api("/me/preferences", { method: "PUT", body: next });
    } catch (err) {
      setPrefs(before);
      setSaving(false);
      setTarget(null);
      setError(`Not saved. ${errorMessage(err)}`);
      return;
    }
    startRefresh(() => {
      setSaving(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Totals in ${shown}. Tap to show them in ${other}.`}
        disabled={saving || refreshing}
        onClick={() => void toggle()}
        data-testid="wallet-currency-switch"
        className="inline-flex h-[44px] shrink-0 items-center gap-[6px] rounded-full bg-(--sp-icon-btn) px-[14px] text-[0.8125rem] font-medium text-(--sp-icon-btn-text) transition outline-none select-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 motion-reduce:transition-none disabled:opacity-70"
      >
        <CurrencyFlag currency={shown} />
        {shown}
      </button>
      <span role="status" className="sr-only">
        {error}
      </span>
    </>
  );
}

/** Wallet home header: the currency pill, then the lock. */
export function WalletHeaderActions({ currency }: { currency: WalletCurrency }) {
  return (
    <div className="flex items-center gap-[8px]">
      <WalletCurrencyPill currency={currency} />
      <LockWalletIconButton />
    </div>
  );
}
