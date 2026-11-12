import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ProgressTone } from "./progress-bar";

const STROKE: Record<ProgressTone, string> = {
  accent: "stroke-(--sp-card-front)",
  ink: "stroke-(--sp-text)",
  success: "stroke-(--sp-success)",
  warning: "stroke-(--sp-warning)",
  danger: "stroke-(--sp-danger)",
  onCard: "stroke-(--sp-card-front-text)",
};

export type ProgressRingProps = {
  /** 0 = empty, 1 = full. Over 1 = full ring in red. */
  value: number;
  tone?: ProgressTone;
  /** Outer size in px. Default 64 (fits a list row: 48; a card: 64–96). */
  size?: number;
  /** Ring thickness in px. Default 7. */
  thickness?: number;
  /** In the middle, e.g. "70%". */
  children?: ReactNode;
  ariaLabel: string;
  className?: string;
};

/** Round progress for goals and budgets. Round line ends, starts at the top. */
export function ProgressRing({
  value,
  tone = "accent",
  size = 64,
  thickness = 7,
  children,
  ariaLabel,
  className,
}: ProgressRingProps) {
  const over = value > 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const onCard = tone === "onCard";
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          className={onCard ? "stroke-white/25" : "stroke-(--sp-soft)"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cn(
            "sp-ring-in transition-[stroke-dashoffset] duration-500 ease-(--sp-ease) motion-reduce:transition-none",
            over ? STROKE.danger : STROKE[tone]
          )}
          style={{ ["--sp-ring-c" as string]: `${c}px` }}
        />
      </svg>
      {children != null ? (
        <span className="absolute inset-0 flex items-center justify-center text-[13px] leading-[1.5] font-semibold tabular-nums">
          {children}
        </span>
      ) : null}
    </div>
  );
}
