import { ProgressBar as KitProgressBar, type ProgressTone } from "@/components/spine-ui";
import type { BudgetStatus } from "@/lib/wallet-types";

const TONE: Record<BudgetStatus, ProgressTone> = { OK: "ink", WARNING: "warning", EXCEEDED: "danger" };

/**
 * Budget / goal bar: the kit's ProgressBar. Budgets: OK ink, WARNING
 * (80–99 %) amber, EXCEEDED (100 %+) red. Goals (no status): the card color.
 */
export function ProgressBar({ percent, status, label }: { percent: number; status?: BudgetStatus; label: string }) {
  return <KitProgressBar value={percent / 100} tone={status ? TONE[status] : "accent"} ariaLabel={label} />;
}

export function statusText(status: BudgetStatus, percent: number): string {
  if (status === "EXCEEDED") return `Over budget (${percent}%)`;
  return `${percent}% used`;
}
