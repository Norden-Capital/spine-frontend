"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Choice = { value: string; label: string; hint?: string; icon?: ReactNode };

export type ChoiceListProps = {
  options: Choice[];
  value: string;
  onValueChange?: (value: string) => void;
  label: string;
  /** "panel" = soft rows (in a white panel or sheet); "page" = white rows on gray. */
  surface?: "panel" | "page";
  className?: string;
};

/**
 * Pick one from a short list (font, date format, period): rows 52 tall,
 * radius 16, 8 apart; the chosen row shows a check. Text in rem.
 */
export function ChoiceList({ options, value, onValueChange, label, surface = "panel", className }: ChoiceListProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("space-y-[8px]", className)}>
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
              "flex min-h-[52px] w-full items-center gap-[12px] rounded-[16px] px-[16px] py-[10px] text-left outline-none transition focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
              surface === "panel" ? "bg-(--sp-soft)" : "bg-(--sp-panel)",
              active && "ring-2 ring-(--sp-text) ring-inset"
            )}
          >
            {o.icon ? <span className="shrink-0 [&_svg]:size-[18px] [&_svg]:stroke-[1.8]">{o.icon}</span> : null}
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[0.8125rem] font-medium text-(--sp-text)">{o.label}</span>
              {o.hint ? <span className="mt-[3px] block text-[0.6875rem] text-(--sp-text-muted)">{o.hint}</span> : null}
            </span>
            {active ? (
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text)">
                <Check aria-hidden className="size-[13px] stroke-[2.6]" />
              </span>
            ) : (
              <span aria-hidden className="size-[22px] shrink-0 rounded-full ring-[1.5px] ring-(--sp-text-faint) ring-inset" />
            )}
          </button>
        );
      })}
    </div>
  );
}
