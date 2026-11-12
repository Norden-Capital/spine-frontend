"use client";

// Small form pieces shared by the wallet managers (budgets, goals, recurring).
import { groupByParent, type Category } from "@/lib/catalog-types";
import { IconChevronDown } from "@/components/spine-ui";
import { Segmented as KitSegmented } from "@/components/spine-ui";

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
      <IconChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[16px] size-[18px] -translate-y-1/2 text-(--sp-text-faint)"
      />
    </div>
  );
}
