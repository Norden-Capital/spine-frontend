import { cn } from "@/lib/utils";
import { IconPause, IconWarning } from "./icons";

export type DueState = "overdue" | "today" | "soon" | "week" | "later" | "paused";

// Text only, no background (user rule: no pills). All colours AA on panels and sheets, light + dark.
const TEXT: Record<Exclude<DueState, "later">, string> = {
  overdue: "text-(--sp-due-red-text)",
  today: "text-(--sp-due-red-text)",
  soon: "text-(--sp-due-soon-text)",
  week: "text-(--sp-due-week-text)",
  paused: "text-(--sp-due-paused-text)",
};

export type DueBadgeProps = {
  /** overdue + today (red) · soon = 1–3 days (amber) · week = 4–7 days (purple) · later (gray) · paused (gray). Text only, no pill. */
  state: DueState;
  /** e.g. "Overdue · 2 days", "Today", "In 2 days", "In 5 days", "Fri 27 Nov", "Paused". */
  label: string;
  className?: string;
};

/**
 * When a repeat payment is due, coloured by urgency: small coloured TEXT
 * (10 / Medium, no background, no pill) next to the date. Each state also
 * has a shape, so colour is not the only signal: overdue = warning icon,
 * today / soon / week = a dot, paused = pause icon, later = muted text.
 */
export function DueBadge({ state, label, className }: DueBadgeProps) {
  if (state === "later") {
    return <span className={cn("-my-[0.25em] text-[0.6875rem] leading-[1.5] whitespace-nowrap text-(--sp-text-muted)", className)}>{label}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-[5px] text-[0.625rem] leading-[1.5] font-medium whitespace-nowrap [&_svg]:size-[12px]",
        TEXT[state],
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
