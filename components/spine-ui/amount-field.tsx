import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Segmented } from "./segmented";

export type AmountFieldProps = Omit<ComponentProps<"input">, "type" | "size"> & {
  /** Currency symbol shown before the number, e.g. "$". */
  symbol: string;
  /** Currency switch (USD / MAD). Leave out for one currency. */
  currencies?: string[];
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  label?: string;
};

/**
 * The amount: the most important field, so it is big. White panel
 * (radius 22) with the label + currency switch on top and the number at
 * 40 / Medium (tabular). Same size as the amounts on the cards.
 */
export function AmountField({
  symbol,
  currencies,
  currency,
  onCurrencyChange,
  label = "Amount",
  id,
  className,
  ...props
}: AmountFieldProps) {
  return (
    <div className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[16px] pt-[14px] pb-[16px]", className)}>
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
      <div className="mt-[10px] flex items-baseline gap-[6px] leading-none">
        <span aria-hidden className="text-[2.5rem] font-medium text-(--sp-text-faint)">
          {symbol}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="h-[52px] w-full min-w-0 bg-transparent text-[2.5rem]! font-medium text-(--sp-text) tabular-nums outline-none placeholder:text-(--sp-text-faint)/60 aria-invalid:text-(--sp-danger)"
          {...props}
        />
      </div>
    </div>
  );
}
