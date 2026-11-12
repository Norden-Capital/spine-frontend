"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { IconCloseGlyph, IconFilter, IconSearch } from "./icons";
import { SP_INPUT_CLASS } from "./field";

export type SearchBarProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  /** Clears the text (shows a round × while there is text). */
  onClear?: () => void;
  /** Filter button right of the search. Leave out = no button. */
  onFilterClick?: () => void;
  /** Number of active filters: badge on the filter button. */
  filterCount?: number;
  /** Busy (results loading): a small spinner replaces the search icon. */
  busy?: boolean;
};

/**
 * Search + filter row for the lists: the kit input (52, search icon,
 * round × to clear) and a 52 round filter button with a purple count badge.
 */
export function SearchBar({
  onClear,
  onFilterClick,
  filterCount = 0,
  busy,
  value,
  placeholder = "Search",
  className,
  ...props
}: SearchBarProps) {
  const hasText = typeof value === "string" ? value.length > 0 : false;
  return (
    <div className={cn("flex gap-[8px]", className)}>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute top-1/2 left-[16px] -translate-y-1/2 text-(--sp-input-icon) [&_svg]:size-[18px]">
          {busy ? (
            <span className="block size-[16px] animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
          ) : (
            <IconSearch />
          )}
        </span>
        <input
          type="search"
          value={value}
          placeholder={placeholder}
          enterKeyHint="search"
          className={cn(
            SP_INPUT_CLASS,
            "h-[52px] pl-[44px]",
            "[&::-webkit-search-cancel-button]:hidden",
            hasText && onClear ? "pr-[48px]" : "pr-[16px]"
          )}
          {...props}
        />
        {hasText && onClear ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={onClear}
            className="absolute top-1/2 right-[4px] flex size-[44px] -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            <span className="flex size-[22px] items-center justify-center rounded-full bg-(--sp-input-icon) text-(--sp-panel) [&_svg]:size-[12px]">
              <IconCloseGlyph />
            </span>
          </button>
        ) : null}
      </div>
      {onFilterClick ? (
        <button
          type="button"
          onClick={onFilterClick}
          aria-label={filterCount ? `Filters, ${filterCount} on` : "Filters"}
          className={cn(
            "relative flex size-[52px] shrink-0 items-center justify-center rounded-full outline-none transition focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:size-[20px]",
            filterCount ? "bg-(--sp-chip-active) text-(--sp-chip-active-text)" : "bg-(--sp-input) text-(--sp-text) hover:bg-(--sp-input-hover)"
          )}
        >
          <IconFilter />
          {filterCount ? (
            <span className="absolute -top-[2px] -right-[2px] flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-(--sp-card-front) px-[5px] text-[0.625rem] leading-[1.5] font-semibold text-white ring-2 ring-(--sp-bg)">
              {filterCount}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
