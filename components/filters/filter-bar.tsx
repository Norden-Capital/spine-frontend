"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { groupByParent, type Category, type Tag } from "@/lib/catalog-types";
import type { Filters } from "@/lib/filters";
import { CURRENCIES, formatMoney, monthLabel, type Currency, type TxType } from "@/lib/transactions-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { TagPicker } from "@/components/expenses/tag-picker";
import { useDates } from "@/components/prefs/prefs-provider";
import { BottomSheet, FilterChip, FilterChips, SpButton } from "@/components/spine-ui";
import { Input } from "@/components/ui/input";

/** Idle chips are panel color; on the sheet (same color) they need the soft gray. */
const ON_SHEET = "bg-(--sp-soft)";

export type PersonOption = { id: string; name: string };

/**
 * Search box + "Filters" sheet + active filter chips. Everything is kept in
 * the page address; changing it reloads the list (and its totals) from the
 * server. Tag names ride along in `tagLabels` (same order as tagIds) so the
 * chips can show names after a reload.
 */
export function FilterBar({
  filters,
  tagLabels,
  categories,
  people,
  tagsPath,
  autoFocusSearch,
}: {
  filters: Filters;
  tagLabels: string[];
  categories: Category[];
  /** "Added by" choices (company list only); empty = hide the field. */
  people: PersonOption[];
  /** "/tags" or "/wallet/tags". */
  tagsPath: string;
  autoFocusSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dates = useDates();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(filters.q ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  // New key on each open = the sheet starts from the current filters.
  const [sheetKey, setSheetKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  /** Go to the same page with new filters (month kept unless a range is set). */
  function apply(next: Filters, labels = tagLabels) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      q.set(k, Array.isArray(v) ? v.join(",") : String(v));
    }
    if (next.tagIds?.length) q.set("tagLabels", labels.join(","));
    startTransition(() => router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false }));
  }

  // Search: wait 400 ms after the last key.
  useEffect(() => {
    if ((filters.q ?? "") === text.trim()) return;
    const t = setTimeout(() => apply({ ...filters, q: text.trim() || undefined }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text starts a search
  }, [text]);

  useEffect(() => {
    if (autoFocusSearch) searchRef.current?.focus();
  }, [autoFocusSearch]);

  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const personName = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);

  // Active filter chips (each one removes itself).
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (filters.from || filters.to) {
    chips.push({
      key: "dates",
      label: `${filters.from ? dates.day(filters.from) : "…"} – ${filters.to ? dates.day(filters.to) : "…"}`,
      remove: () => apply({ ...filters, from: undefined, to: undefined }),
    });
  }
  for (const id of filters.categoryIds ?? []) {
    chips.push({
      key: `c-${id}`,
      label: catName.get(id) ?? "Category",
      remove: () => apply({ ...filters, categoryIds: filters.categoryIds!.filter((x) => x !== id) }),
    });
  }
  (filters.tagIds ?? []).forEach((id, i) => {
    chips.push({
      key: `t-${id}`,
      label: `#${tagLabels[i] ?? "tag"}`,
      remove: () =>
        apply(
          { ...filters, tagIds: filters.tagIds!.filter((x) => x !== id) },
          tagLabels.filter((_, j) => j !== i)
        ),
    });
  });
  if (filters.type) {
    chips.push({ key: "type", label: filters.type === "INCOME" ? "Income" : "Expense", remove: () => apply({ ...filters, type: undefined }) });
  }
  if (filters.currency) {
    chips.push({ key: "cur", label: filters.currency, remove: () => apply({ ...filters, currency: undefined }) });
  }
  if (filters.createdBy) {
    chips.push({
      key: "by",
      label: `By ${personName.get(filters.createdBy) ?? "someone"}`,
      remove: () => apply({ ...filters, createdBy: undefined }),
    });
  }
  if (filters.minAmount || filters.maxAmount) {
    const cur: Currency = filters.currency ?? "USD";
    chips.push({
      key: "amount",
      label: filters.minAmount && filters.maxAmount
        ? `${formatMoney(filters.minAmount, cur)} – ${formatMoney(filters.maxAmount, cur)}`
        : filters.minAmount
          ? `≥ ${formatMoney(filters.minAmount, cur)}`
          : `≤ ${formatMoney(filters.maxAmount!, cur)}`,
      remove: () => apply({ ...filters, minAmount: undefined, maxAmount: undefined }),
    });
  }

  const count = chips.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-(--sp-text-faint)" aria-hidden />
          <Input
            ref={searchRef}
            type="search"
            aria-label="Search"
            placeholder="Search description or comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-12 rounded-full border-0 bg-(--sp-panel) pl-10 shadow-none dark:bg-(--sp-panel)"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setSheetKey((k) => k + 1);
            setSheetOpen(true);
          }}
          aria-label={count ? `Filters, ${count} on` : "Filters"}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-(--sp-panel) text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
        >
          <SlidersHorizontal className="size-[18px]" aria-hidden />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-(--sp-card-front) text-[10px] font-semibold text-white">
              {count}
            </span>
          )}
        </button>
      </div>

      {(count > 0 || pending) && (
        <div className="flex flex-col gap-1" aria-busy={pending}>
          <FilterChips label="Active filters">
            {chips.map((c) => (
              <FilterChip
                key={c.key}
                active
                label={c.label}
                icon={<X aria-hidden />}
                onClick={c.remove}
                aria-label={`Remove filter ${c.label}`}
              />
            ))}
            {count > 1 && <FilterChip label="Clear all" onClick={() => apply({ q: filters.q, month: filters.month })} />}
          </FilterChips>
          {pending && <span className="text-[12px] text-(--sp-text-faint)">Loading…</span>}
        </div>
      )}

      <FilterSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        tagLabels={tagLabels}
        categories={categories}
        people={people}
        tagsPath={tagsPath}
        onApply={(next, labels) => {
          setSheetOpen(false);
          apply({ ...next, q: filters.q }, labels);
        }}
      />
    </div>
  );
}

/** Bottom sheet with every filter; "Show results" applies them. */
function FilterSheet({
  open,
  onOpenChange,
  filters,
  tagLabels,
  categories,
  people,
  tagsPath,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  tagLabels: string[];
  categories: Category[];
  people: PersonOption[];
  tagsPath: string;
  onApply: (f: Filters, tagLabels: string[]) => void;
}) {
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [cats, setCats] = useState<string[]>(filters.categoryIds ?? []);
  const [tags, setTags] = useState<Tag[]>(
    (filters.tagIds ?? []).map((id, i) => ({ id, name: tagLabels[i] ?? "tag", archived: false }))
  );
  const [type, setType] = useState<TxType | "">(filters.type ?? "");
  const [currency, setCurrency] = useState<Currency | "">(filters.currency ?? "");
  const [by, setBy] = useState(filters.createdBy ?? "");
  const [min, setMin] = useState(filters.minAmount ?? "");
  const [max, setMax] = useState(filters.maxAmount ?? "");

  const toggleCat = (id: string) => setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const clean = (v: string) => v.trim().replace(",", ".") || undefined;

  function submit() {
    onApply(
      {
        month: from || to ? undefined : filters.month,
        from: from || undefined,
        to: to || undefined,
        categoryIds: cats,
        tagIds: tags.map((t) => t.id),
        type: type || undefined,
        currency: currency || undefined,
        createdBy: by || undefined,
        minAmount: clean(min),
        maxAmount: clean(max),
      },
      tags.map((t) => t.name)
    );
  }

  function reset() {
    setFrom("");
    setTo("");
    setCats([]);
    setTags([]);
    setType("");
    setCurrency("");
    setBy("");
    setMin("");
    setMax("");
  }

  const grouped = groupByParent(categories.filter((c) => !c.archived));

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      footer={
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <SpButton variant="secondary" onClick={reset}>
            Reset
          </SpButton>
          <SpButton onClick={submit}>Show results</SpButton>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Section title="Dates">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-(--sp-text-muted)">
              From
              <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-11" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-(--sp-text-muted)">
              To
              <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-11" />
            </label>
          </div>
          {!from && !to && filters.month && (
            <p className="text-xs text-(--sp-text-muted)">Empty = {monthLabel(filters.month)}.</p>
          )}
        </Section>

        <Section title="Type">
          <Choice
            value={type}
            onChange={setType}
            options={[
              { value: "", label: "All" },
              { value: "EXPENSE", label: "Expense" },
              { value: "INCOME", label: "Income" },
            ]}
          />
        </Section>

        <Section title="Currency">
          <Choice
            value={currency}
            onChange={setCurrency}
            options={[{ value: "", label: "All" }, ...CURRENCIES.map((c) => ({ value: c, label: c }))]}
          />
        </Section>

        {grouped.length > 0 && (
          <Section title="Categories">
            <div className="flex flex-wrap gap-2">
              {grouped.map(({ item: c, child }) => (
                <FilterChip
                  key={c.id}
                  active={cats.includes(c.id)}
                  className={cats.includes(c.id) ? undefined : ON_SHEET}
                  onClick={() => toggleCat(c.id)}
                  icon={<CategoryIcon name={c.icon} />}
                  label={child ? `↳ ${c.name}` : c.name}
                />
              ))}
            </div>
            <p className="text-xs text-(--sp-text-muted)">A main category also shows its subcategories.</p>
          </Section>
        )}

        <Section title="Tags">
          <TagPicker value={tags} onChange={setTags} basePath={tagsPath} allowCreate={false} />
        </Section>

        {people.length > 0 && (
          <Section title="Added by">
            <Choice
              value={by}
              onChange={setBy}
              options={[{ value: "", label: "Anyone" }, ...people.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </Section>
        )}

        <Section title="Amount">
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} className="h-11" aria-label="Minimum amount" />
            <Input inputMode="decimal" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} className="h-11" aria-label="Maximum amount" />
          </div>
        </Section>
      </div>
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[13px] font-medium">{title}</h3>
      {children}
    </section>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <FilterChip
          key={o.value || "all"}
          role="radio"
          aria-checked={o.value === value}
          aria-pressed={undefined}
          active={o.value === value}
          className={o.value === value ? undefined : ON_SHEET}
          label={o.label}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}
