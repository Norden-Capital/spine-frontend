"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconCloseGlyph } from "./icons";

export type ActiveFilter = {
  key: string;
  label: string;
  /** Small icon before the label (e.g. the category icon). */
  icon?: ReactNode;
  onRemove: () => void;
};

/**
 * Active filters under the search bar: black chips (32) with a × (44 tap)
 * and a "Clear all" text button. The row scrolls sideways inside itself.
 * Renders nothing when there are no filters.
 */
export function ActiveFilters({
  items,
  onClearAll,
  className,
}: {
  items: ActiveFilter[];
  onClearAll?: () => void;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div
      role="group"
      aria-label="Active filters"
      className={cn(
        "-mx-(--sp-gutter) flex items-center gap-[8px] overflow-x-auto px-(--sp-gutter) py-[2px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {items.map((f) => (
        <span
          key={f.key}
          className="inline-flex h-[32px] shrink-0 items-center gap-[6px] rounded-full bg-(--sp-chip-active) pr-[4px] pl-[12px] text-[0.75rem] leading-none font-medium whitespace-nowrap text-(--sp-chip-active-text) [&_svg]:size-[14px]"
        >
          {f.icon}
          {f.label}
          <button
            type="button"
            aria-label={`Remove filter ${f.label}`}
            onClick={f.onRemove}
            className="relative flex size-[24px] items-center justify-center rounded-full opacity-70 outline-none after:absolute after:-inset-[10px] after:content-[''] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-(--sp-ring) [&_svg]:size-[12px]"
          >
            <IconCloseGlyph />
          </button>
        </span>
      ))}
      {onClearAll && items.length > 1 ? (
        <button
          type="button"
          onClick={onClearAll}
          className="relative h-[32px] shrink-0 px-[8px] text-[0.75rem] leading-none font-medium text-(--sp-card-front) outline-none after:absolute after:inset-x-0 after:-inset-y-[6px] after:content-[''] focus-visible:ring-2 focus-visible:ring-(--sp-ring)"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
