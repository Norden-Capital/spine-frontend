import { cn } from "@/lib/utils";
import { IconPause, IconWarning } from "./icons";

export type DueState = "overdue" | "today" | "soon" | "week" | "later" | "paused";

const PILL: Record<Exclude<DueState, "later">, string> = {
  overdue: "bg-(--sp-due-overdue-bg) text-(--sp-due-overdue-text)",
  today: "bg-(--sp-due-today-bg) text-(--sp-due-today-text)",
  soon: "bg-(--sp-due-soon-bg) text-(--sp-due-soon-text)",
  week: "bg-(--sp-due-week-bg) text-(--sp-due-week-text)",
  paused: "bg-(--sp-due-paused-bg) text-(--sp-due-paused-text)",
};

export type DueBadgeProps = {
  /** overdue (red, solid) · today (orange) · soon = 1–3 days (amber) · week = 4–7 days (purple) · later (plain gray text, no pill) · paused (gray). */
  state: DueState;
  /** e.g. "Overdue · 2 days", "Today", "In 2 days", "In 5 days", "Fri 27 Nov", "Paused". */
  label: string;
  className?: string;
};

/**
 * When a repeat payment is due, coloured by urgency: a small pill (22, like
 * SpBadge, 10 / Medium) next to the date. Each state also has a shape, so
 * colour is not the only signal: overdue = warning icon, today / soon / week
 * = a dot, paused = pause icon, later = no pill (muted text).
 */
export function DueBadge({ state, label, className }: DueBadgeProps) {
  if (state === "later") {
    return <span className={cn("text-[0.6875rem] leading-none whitespace-nowrap text-(--sp-text-muted)", className)}>{label}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-full px-[9px] text-[0.625rem] leading-none font-medium whitespace-nowrap [&_svg]:size-[12px]",
        PILL[state],
        className
      )}
    >
      {state === "overdue" ? (
        <IconWarning />
      ) : state === "paused" ? (
        <IconPause />
      ) : (
        <span aria-hidden className="size-[6px] rounded-full bg-current" />
      )}
      {label}
    </span>
  );
}
