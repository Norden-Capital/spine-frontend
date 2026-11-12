"use client";

// Small form pieces shared by the wallet managers (budgets, goals, recurring).
import { groupByParent, type Category } from "@/lib/catalog-types";
import { CURRENCIES, type Currency } from "@/lib/transactions-types";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-muted p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg px-1 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function CurrencyChoice({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return <Segmented label="Currency" value={value} onChange={onChange} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />;
}

/** Category select; subcategories are shown under their main category. */
export function CategorySelect({
  id,
  categories,
  value,
  onChange,
  emptyLabel,
}: {
  id: string;
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  /** First option (e.g. "All categories"); omit to force a choice. */
  emptyLabel?: string;
}) {
  return (
    <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full">
      <NativeSelectOption value="">{emptyLabel ?? "Choose a category"}</NativeSelectOption>
      {groupByParent(categories.filter((c) => !c.archived || c.id === value)).map(({ item, child }) => (
        <NativeSelectOption key={item.id} value={item.id}>
          {child ? `   ↳ ${item.name}` : item.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
