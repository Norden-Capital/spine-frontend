"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IconLock } from "@/components/spine-ui";
import { api } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { BudgetSheet } from "@/components/wallet/budgets-manager";
import { GoalSheet } from "@/components/wallet/goals-manager";
import {
  ADD_PILL_CLASS,
  ADD_PILL_DOT_CLASS,
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
export function SheetPill({ sheet, label, icon }: { sheet: "goal" | "budget"; label: string; icon: ReactNode }) {
  const open = useOpenSheet();
  return (
    <button
      type="button"
      onClick={() => open(sheet)}
      aria-haspopup="dialog"
      className={ADD_PILL_CLASS}
      data-testid={`savings-set-${sheet}`}
    >
      <span className={ADD_PILL_DOT_CLASS}>{icon}</span>
      {label}
    </button>
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
        void api("/wallet/lock", { method: "POST" })
          .catch(() => {})
          .finally(() => router.refresh());
      }}
    >
      <IconLock aria-hidden />
    </button>
  );
}
