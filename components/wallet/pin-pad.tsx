"use client";

import { useEffect, useState } from "react";
import { PinDots, PinPad as KitPinPad } from "@/components/spine-ui";

export const PIN_LENGTH = 6;

/**
 * Wallet PIN entry: the kit's PinDots + PinPad (72px keys), with the typed
 * digits kept here. Calls onComplete with the 6 digits; `reset` (a changing
 * number) clears them, e.g. after a wrong PIN. A hardware keyboard works too.
 */
export function PinPad({
  onComplete,
  disabled,
  reset,
  error,
}: {
  onComplete: (pin: string) => void;
  disabled?: boolean;
  reset?: number;
  /** Red dots + shake (the kit's error state). */
  error?: boolean;
}) {
  const [digits, setDigits] = useState("");

  // Clear after a wrong PIN or a step change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset is an outside signal
    setDigits("");
  }, [reset]);

  function press(d: string) {
    if (disabled || digits.length >= PIN_LENGTH) return;
    const next = digits + d;
    setDigits(next);
    // Short pause so the 6th dot shows before the check.
    if (next.length === PIN_LENGTH) setTimeout(() => onComplete(next), 120);
  }
  const back = () => !disabled && setDigits((cur) => cur.slice(0, -1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <PinDots length={PIN_LENGTH} filled={digits.length} error={error && digits.length === 0} errorKey={reset} />
      <KitPinPad onDigit={press} onDelete={back} disabled={disabled} />
    </div>
  );
}
