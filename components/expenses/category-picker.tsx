"use client";

import type { Category } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";

/**
 * Pick one category (required). Shows active categories as big buttons,
 * icon + name, two per row on a phone. Load the list on the server with
 * getActiveCategories() (lib/catalog-server.ts) and pass it in.
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
  labelledBy,
}: {
  categories: Category[];
  value: string | null;
  onChange: (id: string) => void;
  /** Form field name for the hidden input (e.g. "categoryId"). */
  name?: string;
  required?: boolean;
  /** Show the error look (e.g. after a submit with nothing picked). */
  invalid?: boolean;
  /** id of the label element that names this group. */
  labelledBy?: string;
}) {
  // Archived categories are hidden, except the one already chosen (editing
  // an old transaction keeps its category).
  const active = categories.filter((c) => !c.archived || c.id === value);

  if (active.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
        No categories yet. Ask a manager to add some.
      </p>
    );
  }

  return (
    <>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-required={required}
        aria-invalid={invalid || undefined}
        className={cn("grid grid-cols-2 gap-2", invalid && "rounded-xl ring-2 ring-destructive/40 ring-offset-2 ring-offset-background")}
      >
        {active.map((c) => {
          const on = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(c.id)}
              className={cn(
                "flex min-h-12 min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                on ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
              )}
            >
              <CategoryIcon name={c.icon} />
              <span className="min-w-0 truncate">{c.name}</span>
            </button>
          );
        })}
      </div>
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
