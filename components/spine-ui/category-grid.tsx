"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FilterChip } from "./filter-chips";

export type CategoryOption = {
  id: string;
  name: string;
  icon: ReactNode;
  /** Subcategories (one level). */
  children?: { id: string; name: string }[];
};

export type CategoryGridProps = {
  options: CategoryOption[];
  /** Chosen main category id. */
  value?: string;
  /** Chosen subcategory id (or undefined = the main one only). */
  subValue?: string;
  onValueChange?: (id: string) => void;
  onSubValueChange?: (id: string | undefined) => void;
  label?: string;
  className?: string;
};

/**
 * Category picker in the quick-actions style: a white panel with round
 * 48 icons + labels, 4 per row. The chosen one is black (white in dark).
 * If it has subcategories, a chip row appears under the grid.
 */
export function CategoryGrid({
  options,
  value,
  subValue,
  onValueChange,
  onSubValueChange,
  label = "Category",
  className,
}: CategoryGridProps) {
  const chosen = options.find((o) => o.id === value);
  return (
    <div className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[6px] pt-[14px] pb-[14px]", className)}>
      <p id="sp-category-label" className="px-[10px] text-[0.8125rem] leading-none font-medium text-(--sp-text)">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby="sp-category-label" className="mt-[14px] grid grid-cols-4 gap-y-[14px]">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onValueChange?.(o.id)}
              className="group flex min-w-0 flex-col items-center gap-[8px] rounded-2xl py-[2px] leading-none outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
            >
              <span
                className={cn(
                  "flex size-[48px] items-center justify-center rounded-full transition group-active:scale-95 [&_svg]:size-[18px] [&_svg]:stroke-[1.8]",
                  active
                    ? "bg-(--sp-chip-active) text-(--sp-card-front)"
                    : "bg-(--sp-soft) text-(--sp-text) group-hover:bg-(--sp-soft-hover)"
                )}
              >
                {o.icon}
              </span>
              <span
                className={cn(
                  "w-full truncate px-[2px] text-center text-[0.6875rem]",
                  active ? "font-medium text-(--sp-text)" : "text-(--sp-text-2)"
                )}
              >
                {o.name}
              </span>
            </button>
          );
        })}
      </div>
      {chosen?.children?.length ? (
        <div className="mt-[16px] px-[10px]">
          <p className="text-[0.6875rem] leading-none text-(--sp-text-muted)">Subcategory</p>
          <div role="group" aria-label="Subcategory" className="mt-[10px] flex flex-wrap gap-[8px]">
            <FilterChip
              label={`All ${chosen.name}`}
              active={!subValue}
              onClick={() => onSubValueChange?.(undefined)}
              className="bg-(--sp-soft) aria-pressed:bg-(--sp-chip-active)"
            />
            {chosen.children.map((c) => (
              <FilterChip
                key={c.id}
                label={c.name}
                active={subValue === c.id}
                onClick={() => onSubValueChange?.(c.id)}
                className="bg-(--sp-soft) aria-pressed:bg-(--sp-chip-active)"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
