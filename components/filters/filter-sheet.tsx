"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import {
  DATE_PRESETS,
  filtersToQuery,
  fitsType,
  groupByKind,
  matchPreset,
  presetPeriod,
  rangeLabel,
  type Filters,
  type Period,
} from "@/lib/filters";
import type { TxType } from "@/lib/transactions-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import {
  BottomSheet,
  CategoryMultiGrid,
  DateRangePicker,
  FilterChip,
  IconCalendar,
  Segmented,
  SpButton,
  SpInput,
  type CategoryOption,
} from "@/components/spine-ui";
import { longMonth } from "./period";

export type PersonOption = { id: string; name: string };

const MONEY = /^\d{1,10}(\.\d{1,2})?$/;
const cleanMoney = (v: string) => {
  const x = v.trim().replace(/[\s ']/g, "").replace(",", ".");
  return MONEY.test(x) ? x : undefined;
};

const COUNT = new Intl.NumberFormat("en-US");

/**
 * The filter sheet: dates (presets + kit calendar), type, categories,
 * amount, "Created by". The footer button shows a live count of what the
 * list would show (GET list?…&size=0 → totalItems), 300 ms after the last
 * change. Mount it with a new key on each open: it starts from `filters`.
 */
export function FilterSheet({
  open,
  onOpenChange,
  startOnDates,
  filters,
  today,
  categories,
  people,
  apiPath,
  initialCount,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opened from the period bar: only the dates view; "Use" applies at once. */
  startOnDates?: boolean;
  /** Current filters (month already filled in when no range). */
  filters: Filters;
  today: string;
  categories: Category[];
  people: PersonOption[];
  apiPath: "/transactions" | "/wallet/transactions";
  /** Count of the current list (no fetch needed for the start state). */
  initialCount?: number;
  onApply: (f: Filters) => void;
}) {
  const current = today.slice(0, 7);
  const [view, setView] = useState<"filters" | "dates">(startOnDates ? "dates" : "filters");
  const [period, setPeriod] = useState<Period>({ month: filters.month, from: filters.from, to: filters.to });
  const [cats, setCats] = useState<string[]>(filters.categoryIds ?? []);
  const [type, setType] = useState<TxType | undefined>(filters.type);
  const [by, setBy] = useState(filters.createdBy ?? "");
  const [min, setMin] = useState(filters.minAmount ?? "");
  const [max, setMax] = useState(filters.maxAmount ?? "");
  // Range being picked in the dates view (not used until "Use").
  const [pick, setPick] = useState<{ from?: string; to?: string }>(
    startOnDates && (filters.from || filters.to) ? { from: filters.from, to: filters.to } : {}
  );

  const draft: Filters = {
    q: filters.q,
    ...(period.from || period.to ? { from: period.from, to: period.to } : { month: period.month ?? current }),
    categoryIds: cats,
    type,
    createdBy: by || undefined,
    minAmount: cleanMoney(min),
    maxAmount: cleanMoney(max),
  };

  // ---- live count ----
  const startQuery = filtersToQuery(filters);
  const query = filtersToQuery(draft);
  const [result, setResult] = useState<{ query: string; n?: number } | null>(null);
  useEffect(() => {
    if (!open || query === startQuery) return;
    let stale = false;
    const t = setTimeout(async () => {
      try {
        const page = await api<{ totalItems?: number }>(`${apiPath}?${query}${query ? "&" : ""}size=0`);
        if (!stale) setResult({ query, n: page.totalItems });
      } catch {
        if (!stale) setResult({ query });
      }
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [open, query, startQuery, apiPath]);
  const count = query === startQuery ? initialCount : result?.query === query ? result.n : undefined;
  const showLabel =
    count === undefined ? "Show results" : `Show ${COUNT.format(count)} result${count === 1 ? "" : "s"}`;
  const counting = query !== startQuery && result?.query !== query;

  // ---- categories ----
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const live = useMemo(() => categories.filter((c) => !c.archived), [categories]);
  const mains = useMemo(() => {
    const ids = new Set(live.map((c) => c.id));
    return live.filter((c) => !c.parentId || !ids.has(c.parentId));
  }, [live]);
  const groups = groupByKind(mains, type);
  const toOption = (c: Category): CategoryOption => {
    const subs = live.filter((k) => k.parentId === c.id);
    return {
      id: c.id,
      name: c.name,
      icon: <CategoryIcon name={c.icon} />,
      children: subs.length ? subs.map((k) => ({ id: k.id, name: k.name })) : undefined,
    };
  };
  /** Main id of a chosen id (a main or a sub). */
  const mainOf = (id: string) => byId.get(id)?.parentId ?? id;

  function changeType(next: TxType | undefined) {
    setType(next);
    // Drop chosen categories that do not fit the new type.
    setCats((list) => list.filter((id) => fitsType(byId.get(id) ?? {}, next)));
  }

  function reset() {
    setPeriod({ month: current });
    setCats([]);
    setType(undefined);
    setBy("");
    setMin("");
    setMax("");
  }

  const preset = matchPreset(period, today);
  const isRange = Boolean(period.from || period.to);

  /** Use a period from the dates view. */
  function pickPeriod(p: Period) {
    if (startOnDates) onApply({ ...filters, month: undefined, from: undefined, to: undefined, ...p });
    else {
      setPeriod(p);
      setView("filters");
    }
  }
  function openDates() {
    setPick(isRange ? { from: period.from, to: period.to } : {});
    setView("dates");
  }

  if (view === "dates") {
    const pickTo = pick.to ?? pick.from;
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Dates"
        description="Tap the first day, then the last day."
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
            <SpButton variant="secondary" onClick={() => (startOnDates ? onOpenChange(false) : setView("filters"))}>
              Cancel
            </SpButton>
            <SpButton disabled={!pick.from} onClick={() => pick.from && pickPeriod({ from: pick.from, to: pickTo })}>
              {pick.from ? `Use ${rangeLabel(pick.from, pickTo, false)}` : "Pick a day"}
            </SpButton>
          </div>
        }
      >
        <div role="group" aria-label="Date presets" className="chip-row">
          {DATE_PRESETS.map((p) => (
            <FilterChip
              key={p.value}
              surface="panel"
              label={p.label}
              active={!pick.from && preset === p.value}
              onClick={() => pickPeriod(presetPeriod(p.value, today))}
            />
          ))}
        </div>
        <DateRangePicker
          className="mt-[14px]"
          today={today}
          initialMonth={(pick.from ?? period.month ?? current).slice(0, 7)}
          from={pick.from}
          to={pick.to}
          onChange={setPick}
        />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      footer={
        <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
          <SpButton variant="secondary" onClick={reset}>
            Reset
          </SpButton>
          <SpButton data-testid="filter-show" aria-busy={counting} onClick={() => onApply(draft)}>
            {showLabel}
          </SpButton>
        </div>
      }
    >
      <SheetSection title="Date">
        <div role="group" aria-label="Date presets" className="chip-row">
          {DATE_PRESETS.map((p) => (
            <FilterChip
              key={p.value}
              surface="panel"
              label={p.label}
              active={preset === p.value}
              onClick={() => setPeriod(presetPeriod(p.value, today))}
            />
          ))}
          <FilterChip
            surface="panel"
            label="Custom…"
            icon={<IconCalendar />}
            active={!preset}
            onClick={openDates}
          />
        </div>
        {!preset ? (
          <button
            type="button"
            data-testid="filter-range-row"
            onClick={openDates}
            className="mt-[10px] flex min-h-[52px] w-full items-center gap-[10px] py-[8px] rounded-[16px] bg-(--sp-input) px-[14px] hover:bg-(--sp-input-hover) text-left outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            <span className="text-(--sp-card-front) [&_svg]:size-[20px]">
              <IconCalendar />
            </span>
            <span className="min-w-0 flex-1 truncate text-[0.8125rem] leading-normal font-medium text-(--sp-text)">
              {isRange ? rangeLabel(period.from, period.to) : longMonth(period.month ?? current)}
            </span>
            <span className="text-[0.6875rem] font-medium text-(--sp-card-front)">Change</span>
          </button>
        ) : null}
      </SheetSection>

      <SheetSection title="Type">
        <Segmented
          label="Type"
          surface="panel"
          value={type ?? "ALL"}
          onValueChange={(v) => changeType(v === "ALL" ? undefined : (v as TxType))}
          items={[
            { value: "ALL", label: "All" },
            { value: "EXPENSE", label: "Expense" },
            { value: "INCOME", label: "Income" },
          ]}
        />
      </SheetSection>

      {mains.length > 0 && (
        <SheetSection title="Categories" hint={cats.length ? `${cats.length} chosen` : "All"}>
          <div className="flex flex-col gap-[16px]">
            {groups.map((g) => {
              const inGroup = new Set(g.items.map((c) => c.id));
              const value = cats.filter((id) => inGroup.has(mainOf(id)));
              return (
                <div key={g.title ?? "all"} role={g.title ? "group" : undefined} aria-label={g.title}>
                  {g.title ? (
                    <p className="mb-[10px] text-[0.6875rem] leading-snug font-medium text-(--sp-text-muted)">{g.title}</p>
                  ) : null}
                  <CategoryMultiGrid
                    className="chip-rows"
                    options={g.items.map(toOption)}
                    value={value}
                    onValueChange={(ids) => setCats([...cats.filter((id) => !inGroup.has(mainOf(id))), ...ids])}
                  />
                </div>
              );
            })}
          </div>
        </SheetSection>
      )}

      <SheetSection title="Amount">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[8px]">
          <SpInput
            surface="panel"
            inputMode="decimal"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            aria-label="Minimum amount"
            aria-invalid={min.trim() !== "" && !cleanMoney(min)}
          />
          <span className="text-(--sp-text-faint)" aria-hidden>
            –
          </span>
          <SpInput
            surface="panel"
            inputMode="decimal"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            aria-label="Maximum amount"
            aria-invalid={max.trim() !== "" && !cleanMoney(max)}
          />
        </div>
      </SheetSection>

      {people.length > 0 && (
        <SheetSection title="Created by" hint="Owner only">
          <div role="group" aria-label="Created by" className="chip-row">
            <FilterChip surface="panel" label="Anyone" active={!by} onClick={() => setBy("")} />
            {people.map((p) => (
              <FilterChip key={p.id} surface="panel" label={p.name} active={by === p.id} onClick={() => setBy(p.id)} />
            ))}
          </div>
        </SheetSection>
      )}
    </BottomSheet>
  );
}

function SheetSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-[color-mix(in_oklab,var(--sp-text)_8%,transparent)] pt-[16px] pb-[18px] first:border-t-0 first:pt-[4px]">
      <div className="mb-[12px] flex items-baseline justify-between gap-3 leading-snug">
        <h3 className="text-[0.8125rem] font-medium text-(--sp-text)">{title}</h3>
        {hint ? <span className="text-[0.625rem] text-(--sp-text-faint)">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}
