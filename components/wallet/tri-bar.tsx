import { IconError, IconSuccess, IconWarning } from "@/components/spine-ui";
import type { BudgetStatus } from "@/lib/wallet-types";
import { cn } from "@/lib/utils";

/** Budget status from a percent, same thresholds as the backend: ≥100 EXCEEDED, ≥80 WARNING. */
export function statusOfPercent(percent: number): BudgetStatus {
  return percent >= 100 ? "EXCEEDED" : percent >= 80 ? "WARNING" : "OK";
}

/** Text colour per status (OK stays gray). */
export const STATUS_TEXT: Record<BudgetStatus, string> = {
  OK: "text-(--sp-text-muted)",
  WARNING: "text-(--sp-warning)",
  EXCEEDED: "text-(--sp-danger)",
};

/** "On track" / "Near the limit" / "Over the limit". */
export const STATUS_WORDS: Record<BudgetStatus, string> = {
  OK: "On track",
  WARNING: "Near the limit",
  EXCEEDED: "Over the limit",
};

/** One icon per status. Drawn icons have a fixed inline size, so it is set with style. */
export function StatusIcon({ status, size = 14 }: { status: BudgetStatus; size?: number }) {
  const Icon = status === "EXCEEDED" ? IconError : status === "WARNING" ? IconWarning : IconSuccess;
  return <Icon style={{ width: size, height: size }} className="shrink-0" />;
}

const PARTS = [
  { from: 0, to: 80, grow: 4, fill: "bg-(--sp-text)", label: "On track", status: "OK" },
  { from: 80, to: 100, grow: 1, fill: "bg-(--sp-warning)", label: "Near limit", status: "WARNING" },
  { from: 100, to: 120, grow: 1, fill: "bg-(--sp-danger)", label: "Over", status: "EXCEEDED" },
] as const;

/**
 * Budget bar in 3 short lines (5px gap, widths 4 : 1 : 1). Each part fills only its own range:
 * On track = 0–80 % (ink), Near limit = 80–100 % (amber), Over = 100–120 %+ (red).
 * `onCard` = white on the purple card, `thin` = 6px (month rows), `legend` = icon + name row.
 */
export function TriBar({
  percent,
  label,
  onCard,
  thin,
  legend,
}: {
  percent: number;
  /** Read by screen readers, e.g. "Groceries: 86% used". */
  label: string;
  onCard?: boolean;
  thin?: boolean;
  legend?: boolean;
}) {
  const p = Number.isFinite(percent) ? percent : 0;
  return (
    <div className="flex flex-col gap-[6px]">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p)}
        aria-valuetext={`${Math.round(p)}%`}
        className="flex gap-[5px]"
      >
        {PARTS.map((part) => {
          const f = Math.max(0, Math.min(1, (p - part.from) / (part.to - part.from)));
          return (
            <div
              key={part.label}
              className={cn(
                "relative overflow-hidden rounded-full",
                thin ? "h-[6px]" : "h-[10px]",
                onCard ? "bg-white/25" : "bg-(--sp-soft)",
              )}
              style={{ flexGrow: part.grow, flexBasis: 0 }}
            >
              <div className={cn("h-full rounded-full", onCard ? "bg-white" : part.fill)} style={{ width: `${f * 100}%` }} />
            </div>
          );
        })}
      </div>
      {legend ? (
        <div
          aria-hidden
          className={cn(
            "flex flex-wrap gap-x-[14px] gap-y-[4px] text-[0.6875rem]",
            onCard ? "text-(--sp-card-front-muted)" : "text-(--sp-text-muted)",
          )}
        >
          {PARTS.map((part) => (
            <span key={part.label} className="flex items-center gap-[4px]">
              <StatusIcon status={part.status} size={12} />
              <span className="truncate">{part.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
