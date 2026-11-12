"use client";

import { groupByParent, type Category } from "@/lib/catalog-types";
import { CategoryGrid, type CategoryOption } from "@/components/spine-ui";
import { cn } from "@/lib/utils";
import { TxLogo } from "./tx-logo";

/**
 * Pick one category (required). Kit CategoryGrid: main categories as round
 * icons (backend order, most used first); when the chosen one has
 * subcategories, they show as chips under the grid ("All <name>" = the main
 * one). Load the list on the server with getActiveCategories()
 * (lib/catalog-server.ts) and pass it in.
 *
 * Inside a <form>, a hidden input `name` carries the chosen id, and
 * `required` stops the form if nothing is chosen.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  name,
  required = true,
  invalid = false,
  label = "Category",
}: {
  categories: Category[];
  value: string | null;
  onChange: (id: string) => void;
  /** Form field name for the hidden input (e.g. "categoryId"). */
  name?: string;
  required?: boolean;
  /** Show the error look (e.g. after a submit with nothing picked). */
  invalid?: boolean;
  /** Title inside the panel. */
  label?: string;
  /** Kept for old callers; the grid has its own label now. */
  labelledBy?: string;
}) {
  // Archived categories are hidden, except the one already chosen (editing
  // an old transaction keeps its category).
  const active = categories.filter((c) => !c.archived || c.id === value);

  if (active.length === 0) {
    return (
      <p className="rounded-(--sp-radius) bg-(--sp-panel) px-[16px] py-[20px] text-center text-[0.8125rem] text-(--sp-text-muted)">
        No categories yet. Ask the owner to add some.
      </p>
    );
  }

  // Main categories (and children whose parent is missing) in backend order.
  const grouped = groupByParent(active);
  const tops = grouped.filter((g) => !g.child).map((g) => g.item);
  const options: CategoryOption[] = tops.map((c) => ({
    id: c.id,
    name: c.name,
    // A bit smaller than the 48 circle, so the "chosen" color still shows around a logo.
    icon: (
      <span className="flex size-[38px] items-center justify-center">
        <TxLogo logoUrl={c.logoUrl} icon={c.icon} />
      </span>
    ),
    children: active.filter((k) => k.parentId === c.id).map((k) => ({ id: k.id, name: k.name })),
  }));

  const chosen = active.find((c) => c.id === value);
  const isSub = Boolean(chosen?.parentId && tops.some((t) => t.id === chosen.parentId));
  const main = isSub ? chosen!.parentId! : (value ?? undefined);
  const sub = isSub ? chosen!.id : undefined;

  return (
    <>
      <CategoryGrid
        label={label}
        options={options}
        value={main}
        subValue={sub}
        onValueChange={(id) => onChange(id)}
        onSubValueChange={(id) => {
          if (id) onChange(id);
          else if (main) onChange(main);
        }}
        className={cn(invalid && "ring-2 ring-(--sp-danger)")}
      />
      {name && (
        // Visually hidden but focusable by the browser's "required" check.
        <input
          tabIndex={-1}
          aria-hidden
          name={name}
          value={value ?? ""}
          required={required}
          onChange={() => {}}
          className="pointer-events-none absolute size-px opacity-0"
        />
      )}
    </>
  );
}
