import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FilterChipProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  active?: boolean;
  /** Small icon before the label. */
  icon?: ReactNode;
  /** Small number after the label, e.g. 12. */
  count?: number;
  /** "page" (default) = white chip on the gray page; "panel" = soft chip inside a white panel or sheet. */
  surface?: "page" | "panel";
};

/**
 * Filter chip: 36 tall (44 tap area), full round, 12 / Medium.
 * Active = like the dock's active item (black / white), idle = like a panel.
 */
export function FilterChip({
  label,
  active,
  icon,
  count,
  surface = "page",
  className,
  type = "button",
  ...props
}: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "relative flex h-[36px] shrink-0 items-center gap-[6px] rounded-full px-[16px] text-[12px] leading-none font-medium whitespace-nowrap transition outline-none select-none",
        "after:absolute after:inset-x-0 after:-inset-y-[4px] after:content-['']",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97]",
        "[&_svg]:size-[14px] [&_svg]:stroke-[1.8]",
        active
          ? "bg-(--sp-chip-active) text-(--sp-chip-active-text)"
          : surface === "panel"
            ? "bg-(--sp-soft) text-(--sp-text)"
            : "bg-(--sp-chip) text-(--sp-chip-text)",
        className
      )}
      {...props}
    >
      {icon}
      {label}
      {count != null ? (
        <span className={cn("tabular-nums", active ? "opacity-70" : "text-(--sp-text-muted)")}>{count}</span>
      ) : null}
    </button>
  );
}

export type FilterChipsProps = {
  /** FilterChip items. */
  children: ReactNode;
  /** Read by screen readers, e.g. "Filter expenses". */
  label: string;
  className?: string;
};

/**
 * One row of chips, 8 apart. Scrolls sideways inside itself (the page
 * never scrolls sideways) and bleeds to the screen edges, like iOS.
 */
export function FilterChips({ children, label, className }: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "-mx-(--sp-gutter) flex gap-[8px] overflow-x-auto px-(--sp-gutter) py-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
