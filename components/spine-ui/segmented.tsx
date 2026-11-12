"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type SegmentedItem = {
  value: string;
  label: string;
  icon?: ReactNode;
  /** With href the items are links (page tabs: Settings, Admin). */
  href?: string;
};

export type SegmentedProps = {
  items: SegmentedItem[];
  value: string;
  onValueChange?: (value: string) => void;
  /** Read by screen readers, e.g. "Type" or "Settings". */
  label: string;
  /** "md" = 44 tall (default), "sm" = 36 (inside a panel, e.g. currency). */
  size?: "md" | "sm";
  /** "page" = white track on the gray page; "panel" = soft track inside a white panel. */
  surface?: "page" | "panel";
  className?: string;
};

/**
 * Segmented control / page tabs. Same language as the dock: the active
 * item is a black pill (white in dark), the others are plain text.
 * Expense/Income, USD/MAD, Light/Dark/Auto, Account/Security/Preferences.
 */
export function Segmented({
  items,
  value,
  onValueChange,
  label,
  size = "md",
  surface = "page",
  className,
}: SegmentedProps) {
  const item = (it: SegmentedItem) => {
    const active = it.value === value;
    const cls = cn(
      "flex min-w-0 flex-1 items-center justify-center gap-[6px] rounded-full px-[12px] leading-none font-medium whitespace-nowrap transition outline-none select-none",
      "focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[15px] [&_svg]:shrink-0 [&_svg]:stroke-[1.8]",
      size === "md" ? "text-[0.8125rem]" : "text-[0.75rem]",
      active
        ? "bg-(--sp-chip-active) text-(--sp-chip-active-text)"
        : "text-(--sp-text-muted) hover:text-(--sp-text)"
    );
    const body = (
      <>
        {it.icon}
        <span className="truncate">{it.label}</span>
      </>
    );
    return it.href ? (
      <Link key={it.value} href={it.href} aria-current={active ? "page" : undefined} className={cls}>
        {body}
      </Link>
    ) : (
      <button
        key={it.value}
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => onValueChange?.(it.value)}
        className={cls}
      >
        {body}
      </button>
    );
  };

  const isTabs = items.some((i) => i.href);
  return (
    <div
      role={isTabs ? undefined : "radiogroup"}
      aria-label={label}
      className={cn(
        "flex shrink-0 rounded-full p-[4px]",
        size === "md" ? "h-[44px]" : "h-[36px] p-[3px]",
        surface === "page" ? "bg-(--sp-panel)" : "bg-(--sp-soft)",
        className
      )}
    >
      {isTabs ? <nav aria-label={label} className="flex flex-1 gap-[2px]">{items.map(item)}</nav> : items.map(item)}
    </div>
  );
}
