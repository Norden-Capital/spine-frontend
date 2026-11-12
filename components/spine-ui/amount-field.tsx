"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconAdd, IconMinus } from "./icons";
import { Segmented } from "./segmented";

export type AmountFieldProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  /** Currency symbol shown before the number, e.g. "$". */
  symbol: string;
  /** Currency switch (USD / MAD). Leave out for one currency. */
  currencies?: string[];
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  label?: string;
  /**
   * Shows a round "−" (left) and "+" (right) around the amount. Called once
   * per step: on tap, on Enter / Space, and again and again while held
   * (first repeat after 400ms, then faster down to every 50ms).
   * Leave out = no buttons.
   */
  onStep?: (delta: 1 | -1) => void;
  /** false = the "−" button is off (e.g. at 0). Default true. */
  canDecrement?: boolean;
  /** false = the "+" button is off. Default true. */
  canIncrement?: boolean;
};

const FIRST_DELAY = 400; // ms before the first repeat
const MIN_DELAY = 50; // fastest repeat
const SPEED_UP = 0.8; // each repeat waits 80% of the last one

/** Round step button with press-and-hold repeat. */
function StepButton({
  label,
  icon,
  disabled,
  onStep,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onStep: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(onStep);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    stepRef.current = onStep;
    disabledRef.current = disabled;
  });

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        stop();
        stepRef.current();
        // Repeat while held, faster each time.
        const tick = (delay: number) => {
          timer.current = setTimeout(() => {
            if (disabledRef.current) return stop();
            stepRef.current();
            tick(Math.max(MIN_DELAY, delay * SPEED_UP));
          }, delay);
        };
        tick(FIRST_DELAY);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onPointerLeave={stop}
      onBlur={stop}
      // Keyboard (Enter / Space) fires a click with detail 0: one step. Pointer clicks are handled above.
      onClick={(e) => {
        if (e.detail === 0 && !disabled) stepRef.current();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "flex size-[48px] shrink-0 touch-manipulation items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) outline-none select-none",
        "transition-[transform,opacity,background-color] duration-150 hover:bg-(--sp-soft-hover) active:scale-90",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) disabled:pointer-events-none disabled:opacity-35",
        "motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:size-[22px]"
      )}
    >
      {icon}
    </button>
  );
}

/** Font size so long amounts still fit between the two buttons. */
function sizeFor(text: string, withButtons: boolean) {
  const n = text.length;
  if (!withButtons) return n > 12 ? "2rem" : "2.5rem";
  if (n > 11) return "1.625rem";
  if (n > 8) return "2rem";
  return "2.5rem";
}

/**
 * The amount: the most important field, so it is big and CENTERED. White
 * panel (radius 22): label + currency switch on top, then the amount at 40
 * / Medium (tabular; smaller when long). With `onStep`, a round "−" and "+"
 * (48) sit left and right. The amount stays a real input (tap to type,
 * inputMode decimal); its width follows the text so the symbol stays next
 * to the number.
 */
export function AmountField({
  symbol,
  currencies,
  currency,
  onCurrencyChange,
  label = "Amount",
  onStep,
  canDecrement = true,
  canIncrement = true,
  id,
  className,
  value,
  defaultValue,
  onChange,
  placeholder = "0.00",
  ...props
}: AmountFieldProps) {
  // Mirror of the text, to size the input to its content (works on every browser).
  const [typed, setTyped] = useState(String(defaultValue ?? ""));
  const text = value !== undefined ? String(value ?? "") : typed;
  const shown = text || String(placeholder);
  const fontSize = sizeFor(shown, !!onStep);

  const amount = (
    <div className="flex min-w-0 items-baseline justify-center gap-[4px] leading-none" style={{ fontSize }}>
      <span aria-hidden className="font-medium text-(--sp-text-faint)">
        {symbol}
      </span>
      <span className="inline-grid min-w-0 overflow-hidden">
        <span aria-hidden className="invisible col-start-1 row-start-1 font-medium whitespace-pre tabular-nums">
          {shown}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          size={1}
          value={value}
          defaultValue={defaultValue}
          placeholder={String(placeholder)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (value === undefined) setTyped(e.target.value);
            onChange?.(e);
          }}
          className="col-start-1 row-start-1 h-[1.3em] w-0 min-w-full bg-transparent p-0 text-center font-medium text-(--sp-text) tabular-nums outline-none placeholder:text-(--sp-text-faint)/60 aria-invalid:text-(--sp-danger)"
          style={{ fontSize: "max(16px, 1em)" }}
          {...props}
        />
      </span>
    </div>
  );

  return (
    <div className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[16px] pt-[14px] pb-[18px]", className)}>
      <div className="flex min-h-[36px] items-center justify-between gap-3">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-(--sp-text)">
          {label}
        </label>
        {currencies && currencies.length > 1 && currency ? (
          <Segmented
            label="Currency"
            size="sm"
            surface="panel"
            className="w-[128px]"
            value={currency}
            onValueChange={onCurrencyChange}
            items={currencies.map((c) => ({ value: c, label: c }))}
          />
        ) : currency ? (
          <span className="text-[0.75rem] font-medium text-(--sp-text-muted)">{currency}</span>
        ) : null}
      </div>
      {onStep ? (
        <div className="mt-[16px] grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-[8px]">
          <StepButton label="Decrease by 1" icon={<IconMinus />} disabled={!canDecrement} onStep={() => onStep(-1)} />
          {amount}
          <StepButton label="Increase by 1" icon={<IconAdd />} disabled={!canIncrement} onStep={() => onStep(1)} />
        </div>
      ) : (
        <div className="mt-[14px]">{amount}</div>
      )}
    </div>
  );
}
