"use client";

import { cn } from "@/lib/utils";

export type TextSizeValue = "small" | "normal" | "large";

const STEPS: { v: TextSizeValue; label: string; px: number }[] = [
  { v: "small", label: "Small", px: 14 },
  { v: "normal", label: "Normal", px: 16 },
  { v: "large", label: "Large", px: 18 },
];

export type TextSizeControlProps = {
  value: TextSizeValue;
  onValueChange?: (value: TextSizeValue) => void;
  /** Line shown at the chosen size. */
  preview?: string;
  className?: string;
};

/**
 * Text size as a 3-step slider: small "A" left, big "A" right, a track with
 * 3 stops (each stop is a 44 tap), then a live preview line at that size.
 */
export function TextSizeControl({
  value,
  onValueChange,
  preview = "Client lunch · $186.40",
  className,
}: TextSizeControlProps) {
  const idx = STEPS.findIndex((s) => s.v === value);
  const step = STEPS[idx] ?? STEPS[1];
  return (
    <div className={className}>
      <div className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[14px]">
        <p className="text-[0.625rem] leading-none text-(--sp-text-muted)">Preview</p>
        <p className="mt-[8px] leading-snug font-medium text-(--sp-text)" style={{ fontSize: `${step.px}px` }}>
          {preview}
        </p>
      </div>
      <div className="mt-[10px] flex items-center gap-[10px]">
        <span aria-hidden className="w-[16px] text-center text-[13px] leading-none font-medium text-(--sp-text-muted)">
          A
        </span>
        <div role="radiogroup" aria-label="Text size" className="relative flex h-[44px] flex-1 items-center">
          <span aria-hidden className="absolute inset-x-[22px] h-[6px] rounded-full bg-(--sp-soft)" />
          <span
            aria-hidden
            className="absolute left-[22px] h-[6px] rounded-full bg-(--sp-card-front) transition-all"
            style={{ width: `calc((100% - 44px) * ${idx / 2})` }}
          />
          <div className="relative flex w-full justify-between">
            {STEPS.map((s, i) => {
              const active = s.v === value;
              return (
                <button
                  key={s.v}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={s.label}
                  onClick={() => onValueChange?.(s.v)}
                  className="flex size-[44px] items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
                >
                  <span
                    className={cn(
                      "rounded-full transition-all",
                      active
                        ? "size-[24px] bg-(--sp-chip-active) ring-[5px] ring-[color-mix(in_oklab,var(--sp-card-front)_30%,transparent)]"
                        : i < idx
                          ? "size-[10px] bg-(--sp-card-front)"
                          : "size-[10px] bg-(--sp-text-faint)"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <span aria-hidden className="w-[16px] text-center text-[20px] leading-none font-medium text-(--sp-text-muted)">
          A
        </span>
      </div>
      <p className="mt-[2px] text-center text-[0.6875rem] leading-none font-medium text-(--sp-text)">{step.label}</p>
    </div>
  );
}
