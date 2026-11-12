"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Category } from "@/lib/catalog-types";
import { DATE_PRESETS, filtersToQuery, hasFilters, matchPreset, rangeLabel, type Filters } from "@/lib/filters";
import { addMonths, formatMoney, formatNet } from "@/lib/transactions-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { ActiveFilters, PeriodBar, SearchBar, type ActiveFilter } from "@/components/spine-ui";
import { FilterSheet, type PersonOption } from "./filter-sheet";
import { longMonth } from "./period";

export type { PersonOption };

const COUNT = new Intl.NumberFormat("en-US");

/**
 * Top of a transaction list: period bar (month switch, or the date range
 * with a × back to the month), search, filter button, active filter chips
 * and the filter sheet. Everything lives in the page address, so a link
 * keeps it and the back button works; a change reloads the list.
 */
export function FilterBar({
  filters,
  today,
  categories,
  people,
  apiPath,
  placeholder,
  totalItems,
  net,
  autoFocusSearch,
}: {
  /** Current filters; `month` is filled in when there is no range. */
  filters: Filters;
  /** Today in the user's zone ("YYYY-MM-DD"). */
  today: string;
  categories: Category[];
  /** "Created by" choices (company list, the owner only); empty = hidden. */
  people: PersonOption[];
  apiPath: "/transactions" | "/wallet/transactions";
  placeholder: string;
  /** How many rows match (from the list answer). */
  totalItems?: number;
  /** Net total in USD (from the list answer). */
  net?: string;
  autoFocusSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const current = today.slice(0, 7);

  /** Go to the same page with new filters (current month left out of the address). */
  function go(next: Filters, replace = false) {
    const f = { ...next };
    if (f.from || f.to) f.month = undefined;
    else if (f.month === current) f.month = undefined;
    const q = filtersToQuery(f);
    const href = `${pathname}${q ? `?${q}` : ""}`;
    startTransition(() => (replace ? router.replace(href, { scroll: false }) : router.push(href, { scroll: false })));
  }

  // ---- search: 400 ms after the last key; Enter / leaving the box = now ----
  const [text, setText] = useState(filters.q ?? "");
  const [seenQ, setSeenQ] = useState(filters.q);
  if (seenQ !== filters.q) {
    // The address changed (back button, chip, …): show its search text.
    setSeenQ(filters.q);
    if ((filters.q ?? "") !== text.trim()) setText(filters.q ?? "");
  }
  const searchNow = (value: string) => {
    const q = value.trim() || undefined;
    if (q !== filters.q) go({ ...filters, q }, true);
  };
  useEffect(() => {
    if ((filters.q ?? "") === text.trim()) return;
    const t = setTimeout(() => searchNow(text), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text starts a search
  }, [text]);

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocusSearch) searchRef.current?.focus();
  }, [autoFocusSearch]);

  // ---- sheet ----
  const [sheet, setSheet] = useState<{ open: boolean; key: number; dates: boolean }>({ open: false, key: 0, dates: false });
  const openSheet = (dates: boolean) => setSheet((s) => ({ open: true, key: s.key + 1, dates }));

  // ---- active filter chips (dates are in the period bar) ----
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const personName = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);
  const chips: ActiveFilter[] = [];
  if (filters.type) {
    chips.push({
      key: "type",
      label: filters.type === "INCOME" ? "Income" : "Expense",
      onRemove: () => go({ ...filters, type: undefined }),
    });
  }
  for (const id of filters.categoryIds ?? []) {
    const c = byId.get(id);
    const parent = c?.parentId ? byId.get(c.parentId) : undefined;
    chips.push({
      key: `c-${id}`,
      label: c ? (parent ? `${parent.name} › ${c.name}` : c.name) : "Category",
      icon: c ? <CategoryIcon name={c.icon} /> : undefined,
      onRemove: () => go({ ...filters, categoryIds: filters.categoryIds!.filter((x) => x !== id) }),
    });
  }
  if (filters.minAmount || filters.maxAmount) {
    const { minAmount: lo, maxAmount: hi } = filters;
    chips.push({
      key: "amount",
      label: lo && hi ? `${formatMoney(lo)} – ${formatMoney(hi)}` : lo ? `≥ ${formatMoney(lo)}` : `≤ ${formatMoney(hi!)}`,
      onRemove: () => go({ ...filters, minAmount: undefined, maxAmount: undefined }),
    });
  }
  if (filters.createdBy) {
    chips.push({
      key: "by",
      label: `By ${personName.get(filters.createdBy) ?? "someone"}`,
      onRemove: () => go({ ...filters, createdBy: undefined }),
    });
  }

  // ---- period bar ----
  const range = Boolean(filters.from || filters.to);
  const month = filters.month ?? current;
  const preset = range ? matchPreset(filters, today) : undefined;
  const presetLabel = preset ? DATE_PRESETS.find((p) => p.value === preset)?.label : undefined;
  const filtered = hasFilters({ ...filters, from: undefined, to: undefined });
  const summary = [
    presetLabel ? rangeLabel(filters.from, filters.to, false) : undefined,
    totalItems === undefined
      ? undefined
      : filtered || range
        ? `${COUNT.format(totalItems)} result${totalItems === 1 ? "" : "s"}`
        : `${COUNT.format(totalItems)} transaction${totalItems === 1 ? "" : "s"}`,
    net !== undefined && totalItems ? formatNet(net) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-3">
      <PeriodBar
        label={range ? (presetLabel ?? rangeLabel(filters.from, filters.to)) : longMonth(month)}
        summary={summary || undefined}
        range={range}
        onClearRange={() => go({ ...filters, from: undefined, to: undefined, month: undefined })}
        onPrev={() => go({ ...filters, month: addMonths(month, -1) })}
        onNext={() => go({ ...filters, month: addMonths(month, 1) })}
        canNext={addMonths(month, 1) <= current}
        onLabelClick={() => openSheet(true)}
      />

      <SearchBar
        ref={searchRef}
        aria-label="Search"
        placeholder={placeholder}
        value={text}
        maxLength={100}
        busy={pending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            searchNow(text);
          }
        }}
        onBlur={() => searchNow(text)}
        onClear={() => {
          setText("");
          searchNow("");
          searchRef.current?.focus();
        }}
        onFilterClick={() => openSheet(false)}
        filterCount={chips.length}
      />

      <ActiveFilters
        items={chips}
        onClearAll={() =>
          go({ ...filters, type: undefined, categoryIds: undefined, minAmount: undefined, maxAmount: undefined, createdBy: undefined })
        }
      />

      <FilterSheet
        key={sheet.key}
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        startOnDates={sheet.dates}
        filters={{ ...filters, month: range ? undefined : month }}
        today={today}
        categories={categories}
        people={people}
        apiPath={apiPath}
        initialCount={totalItems}
        onApply={(next) => {
          setSheet((s) => ({ ...s, open: false }));
          go({ ...next, q: filters.q });
        }}
      />
    </div>
  );
}
