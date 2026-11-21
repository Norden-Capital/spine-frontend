"use client";

import type { ReactNode } from "react";
import { IconBackspace } from "./icons";
import { cn } from "@/lib/utils";

export type PinPadProps = {
  /** A digit key was pressed ("0"–"9"). */
  onDigit: (digit: string) => void;
  /** The delete key was pressed. */
  onDelete: () => void;
  /** Optional key bottom-left (e.g. "Cancel" or Face ID). Empty if not set. */
  extraKey?: { label: string; content: ReactNode; onPress: () => void };
  disabled?: boolean;
  className?: string;
};

const KEY_BASE =
  "flex items-center justify-center rounded-full leading-[1.5] outline-none select-none transition " +
  "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 disabled:pointer-events-none disabled:opacity-40";
const KEY = `${KEY_BASE} size-[72px]`;

/**
 * Number keypad for the wallet PIN: 3 × 4 round keys, 72px (thumb size),
 * 16px between rows. The delete key is bigger (80px tap area, 40px icon). Keys look like the top bar buttons (white on gray /
 * dark gray on black). Digit 26 / Medium.
 * No state inside: the parent keeps the typed PIN.
 */
export function PinPad({ onDigit, onDelete, extraKey, disabled, className }: PinPadProps) {
  const digit = (d: string) => (
    <button
      key={d}
      type="button"
      disabled={disabled}
      onClick={() => onDigit(d)}
      className={cn(KEY, "bg-(--sp-key) text-[26px] font-medium text-(--sp-key-text)")}
    >
      {d}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="PIN keypad"
      className={cn("mx-auto grid w-full max-w-[288px] grid-cols-3 justify-items-center gap-y-[16px]", className)}
    >
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit)}
      {extraKey ? (
        <button
          type="button"
          aria-label={extraKey.label}
          disabled={disabled}
          onClick={extraKey.onPress}
          className={cn(KEY, "text-[13px] font-medium text-(--sp-text) [&_svg]:size-[24px] [&_svg]:stroke-[1.6]")}
        >
          {extraKey.content}
        </button>
      ) : (
        <span aria-hidden className="size-[72px]" />
      )}
      {digit("0")}
      <button
        type="button"
        aria-label="Delete"
        disabled={disabled}
        onClick={onDelete}
        // Bigger tap area (80) and icon (40); the -4 margin keeps the 72 grid cell, so rows stay aligned.
        className={cn(KEY_BASE, "-m-[4px] size-[80px] text-(--sp-text) [&_svg]:stroke-[1.6]")}
      >
        {/* Drawn icon: its inline 24px size beats classes, so the size goes in style. */}
        <IconBackspace style={{ width: 40, height: 40 }} />
      </button>
    </div>
  );
}
