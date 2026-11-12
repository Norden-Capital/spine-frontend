"use client";

// Small form pieces shared by the wallet managers (budgets, goals, recurring).
import { groupByParent, type Category } from "@/lib/catalog-types";

import { Segmented as KitSegmented, SpSelect } from "@/components/spine-ui";

/** Label text + " (optional)" in the faint color (same look as SpField `optional`). */
export function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children}
      <span className="font-normal text-(--sp-text-faint)"> (optional)</span>
    </span>
  );
}

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
    <SpSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0">
      <option value="">{emptyLabel ?? "Choose a category"}</option>
      {groupByParent(categories.filter((c) => !c.archived || c.id === value)).map(({ item, child }) => (
        <option key={item.id} value={item.id}>
          {child ? `   ↳ ${item.name}` : item.name}
        </option>
      ))}
    </SpSelect>
  );
}
