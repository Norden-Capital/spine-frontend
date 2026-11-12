import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE = {
  neutral: "bg-[color-mix(in_oklab,var(--sp-text)_8%,transparent)] text-(--sp-text-2)",
  accent: "bg-[color-mix(in_oklab,var(--sp-card-front)_14%,transparent)] text-(--sp-card-front)",
  success: "bg-[color-mix(in_oklab,var(--sp-success)_14%,transparent)] text-(--sp-success)",
  warning: "bg-[color-mix(in_oklab,var(--sp-warning)_16%,transparent)] text-(--sp-warning)",
  danger: "bg-[color-mix(in_oklab,var(--sp-danger)_14%,transparent)] text-(--sp-danger)",
} as const;

export type SpBadgeProps = { tone?: keyof typeof TONE; children: ReactNode; className?: string };

/** Small status pill: 22 tall, 10 / Medium (role, status, "Archived"). */
export function SpBadge({ tone = "neutral", children, className }: SpBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-full px-[9px] text-[0.625rem] leading-[1.5] font-medium whitespace-nowrap",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
