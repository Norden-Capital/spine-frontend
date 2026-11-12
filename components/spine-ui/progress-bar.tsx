import { cn } from "@/lib/utils";

export type ProgressTone = "accent" | "ink" | "success" | "warning" | "danger" | "onCard";

const FILL: Record<ProgressTone, string> = {
  accent: "bg-(--sp-card-front)",
  ink: "bg-(--sp-text)",
  success: "bg-(--sp-success)",
  warning: "bg-(--sp-warning)",
  danger: "bg-(--sp-danger)",
  onCard: "bg-(--sp-card-front-text)",
};

export type ProgressBarProps = {
  /** 0 = empty, 1 = full. Over 1 = over budget (bar full, red). */
  value: number;
  tone?: ProgressTone;
  /** Text left above the bar, e.g. "Travel". */
  label?: string;
  /** Text right above the bar, e.g. "$420 of $600". */
  valueText?: string;
  /** Read by screen readers, e.g. "Travel budget". Defaults to label. */
  ariaLabel?: string;
  className?: string;
};

/**
 * Budget / goal bar: 8px tall, full round. Track = soft circle color
 * (or white 25% on a card). Label 12 / Medium, value 12 gray, 8 above the bar.
 */
export function ProgressBar({ value, tone = "accent", label, valueText, ariaLabel, className }: ProgressBarProps) {
  const over = value > 1;
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const onCard = tone === "onCard";
  return (
    <div className={cn("leading-none", className)}>
      {label || valueText ? (
        <div className="mb-[8px] flex items-baseline justify-between gap-3">
          {label ? (
            <span className={cn("truncate text-[12px] font-medium", onCard ? "" : "text-(--sp-text)")}>{label}</span>
          ) : (
            <span />
          )}
          {valueText ? (
            <span
              className={cn(
                "shrink-0 text-[12px] tabular-nums",
                onCard ? "text-(--sp-card-front-muted)" : over ? "text-(--sp-danger)" : "text-(--sp-text-muted)"
              )}
            >
              {valueText}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={ariaLabel ?? label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        className={cn("h-[8px] overflow-hidden rounded-full", onCard ? "bg-white/25" : "bg-(--sp-soft)")}
      >
        <div
          className={cn(
            "sp-grow-x h-full rounded-full transition-[width] duration-500 ease-(--sp-ease) motion-reduce:transition-none",
            over ? FILL.danger : FILL[tone]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
