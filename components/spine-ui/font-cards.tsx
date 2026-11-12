"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FontOption = {
  value: string;
  label: string;
  /** CSS font-family for the preview, e.g. "var(--font-inter)". */
  family: string;
  hint?: string;
};

export type FontCardsProps = {
  options: FontOption[];
  value: string;
  onValueChange?: (value: string) => void;
  /** Sample line in each font. */
  sample?: string;
  className?: string;
};

/**
 * Font picker as 2 × 2 cards: big "Aa" and a sample line, each drawn in
 * its own real font. Soft cards in a panel; chosen = black ring + check.
 */
export function FontCards({ options, value, onValueChange, sample = "$3,922.40 · Taxi", className }: FontCardsProps) {
  return (
    <div role="radiogroup" aria-label="Font" className={cn("grid grid-cols-2 gap-[10px]", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange?.(o.value)}
            className={cn(
              "relative flex min-h-[112px] flex-col items-start rounded-[18px] bg-(--sp-soft) px-[14px] pt-[12px] pb-[12px] text-left outline-none transition focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
              active && "ring-[2.5px] ring-(--sp-text) ring-inset"
            )}
          >
            <span className="text-[2rem] leading-none font-medium text-(--sp-text)" style={{ fontFamily: o.family }}>
              Aa
            </span>
            <span
              className="mt-[10px] w-full truncate text-[0.75rem] leading-tight text-(--sp-text-2)"
              style={{ fontFamily: o.family }}
            >
              {sample}
            </span>
            <span className="mt-auto flex w-full items-center justify-between gap-2 pt-[10px] leading-none">
              <span className="text-[0.6875rem] font-medium text-(--sp-text)">
                {o.label}
                {o.hint ? <span className="font-normal text-(--sp-text-muted)"> · {o.hint}</span> : null}
              </span>
            </span>
            {active ? (
              <span className="absolute top-[10px] right-[10px] flex size-[22px] items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text)">
                <Check aria-hidden className="size-[13px] stroke-[2.6]" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
