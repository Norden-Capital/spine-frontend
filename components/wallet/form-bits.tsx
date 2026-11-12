"use client";

// Small form pieces shared by the wallet managers (budgets, goals, recurring).
import { groupByParent, type Category } from "@/lib/catalog-types";
import { CURRENCIES, type Currency } from "@/lib/transactions-types";
import { ChevronDown } from "lucide-react";
import { Segmented as KitSegmented } from "@/components/spine-ui";

/** Kit Segmented (black active pill) with a typed value. */
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
  return <KitSegmented label={label} value={value} onValueChange={(v) => onChange(v as T)} items={options} />;
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
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full min-w-0 appearance-none rounded-[16px] bg-(--sp-panel) pr-[44px] pl-[16px] text-(--sp-text) outline-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front)"
      >
        <option value="">{emptyLabel ?? "Choose a category"}</option>
        {groupByParent(categories.filter((c) => !c.archived || c.id === value)).map(({ item, child }) => (
          <option key={item.id} value={item.id}>
            {child ? `   ↳ ${item.name}` : item.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[16px] size-[18px] -translate-y-1/2 text-(--sp-text-faint)"
      />
    </div>
  );
}
