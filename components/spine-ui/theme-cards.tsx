"use client";

import { IconCheckGlyph } from "./icons";
import { cn } from "@/lib/utils";

export type ThemeValue = "light" | "dark" | "auto";

type Colors = { bg: string; panel: string; text: string; dock: string; active: string };
const LIGHT: Colors = { bg: "#eeeeee", panel: "#ffffff", text: "#000000", dock: "#000000", active: "#ffffff" };
const DARK: Colors = { bg: "#000000", panel: "#1f1f1f", text: "#ffffff", dock: "#1f1f1f", active: "#ffffff" };

/** A tiny phone screen in the kit style (top bar, the two cards, a panel, the dock). */
function MiniScreen({ c }: { c: Colors }) {
  return (
    <span className="flex h-full w-full flex-col gap-[5px] p-[7px]" style={{ background: c.bg }}>
      <span className="flex justify-between">
        <span className="size-[9px] rounded-full" style={{ background: c.panel }} />
        <span className="size-[9px] rounded-full" style={{ background: c.text }} />
      </span>
      <span className="h-[4px] w-[55%] rounded-full" style={{ background: c.text, opacity: 0.85 }} />
      <span className="relative mt-[2px]">
        <span className="block h-[14px] rounded-[6px] bg-(--sp-card-back)" />
        <span className="-mt-[8px] block h-[26px] rounded-[6px] bg-(--sp-card-front)" />
      </span>
      <span className="h-[16px] rounded-[6px]" style={{ background: c.panel }} />
      <span className="mt-auto flex h-[10px] items-center gap-[2px] self-center rounded-full px-[2px]" style={{ background: c.dock }}>
        <span className="h-[6px] w-[14px] rounded-full" style={{ background: c.active }} />
        <span className="size-[6px] rounded-full bg-white/30" />
        <span className="size-[6px] rounded-full bg-white/30" />
      </span>
    </span>
  );
}

export type ThemeCardsProps = {
  value: ThemeValue;
  onValueChange?: (value: ThemeValue) => void;
  className?: string;
};

/**
 * Theme picker as 3 preview cards: a mini Light screen, a mini Dark screen,
 * and Auto (half and half). The chosen card has a black ring + check.
 */
export function ThemeCards({ value, onValueChange, className }: ThemeCardsProps) {
  const items: { v: ThemeValue; label: string }[] = [
    { v: "light", label: "Light" },
    { v: "dark", label: "Dark" },
    { v: "auto", label: "Auto" },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("grid grid-cols-3 gap-[10px]", className)}>
      {items.map((it) => {
        const active = it.v === value;
        return (
          <button
            key={it.v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onValueChange?.(it.v)}
            className="group flex flex-col items-center gap-[8px] rounded-[18px] outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            <span
              className={cn(
                "relative block aspect-[0.62] w-full overflow-hidden rounded-[16px] transition",
                active ? "ring-[2.5px] ring-(--sp-text) ring-offset-[3px] ring-offset-(--sp-panel)" : "ring-1 ring-[color-mix(in_oklab,var(--sp-text)_12%,transparent)]"
              )}
            >
              {it.v === "auto" ? (
                <span className="flex h-full">
                  <span className="relative w-1/2 overflow-hidden">
                    <span className="absolute inset-y-0 left-0 w-[200%]">
                      <MiniScreen c={LIGHT} />
                    </span>
                  </span>
                  <span className="relative w-1/2 overflow-hidden">
                    <span className="absolute inset-y-0 right-0 w-[200%]">
                      <MiniScreen c={DARK} />
                    </span>
                  </span>
                </span>
              ) : (
                <MiniScreen c={it.v === "light" ? LIGHT : DARK} />
              )}
              {active ? (
                <span className="absolute right-[6px] bottom-[6px] flex size-[20px] items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text) ring-2 ring-(--sp-panel)">
                  <IconCheckGlyph className="size-[12px]" />
                </span>
              ) : null}
            </span>
            <span className={cn("text-[0.75rem] leading-none", active ? "font-medium text-(--sp-text)" : "text-(--sp-text-muted)")}>
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
