import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE = {
  violet: "bg-(--sp-card-front) text-(--sp-card-front-text)",
  sun: "bg-(--sp-card-back) text-(--sp-card-back-text)",
  ink: "bg-(--sp-chip-active) text-(--sp-chip-active-text)",
  green: "bg-(--sp-success) text-white",
  red: "bg-(--sp-danger) text-white",
  soft: "bg-(--sp-soft) text-(--sp-text)",
} as const;

export type IconTileTone = keyof typeof TONE;

export type IconTileProps = {
  children: ReactNode;
  tone?: IconTileTone;
  /** 33 (rows), 44 (cards), 52 (big entries). */
  size?: 33 | 44 | 52;
  className?: string;
};

/**
 * Colored rounded icon square (iOS-settings feel) in the kit colors:
 * violet and sun like the cards, ink like the dock. Radius = size × 0.3.
 */
export function IconTile({ children, tone = "violet", size = 33, className }: IconTileProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center [&_svg]:stroke-[1.9]",
        size === 33 && "size-[33px] rounded-[10px] [&_svg]:size-[16px]",
        size === 44 && "size-[44px] rounded-[13px] [&_svg]:size-[20px]",
        size === 52 && "size-[52px] rounded-[16px] [&_svg]:size-[22px]",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
