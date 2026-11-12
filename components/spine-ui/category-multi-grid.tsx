"use client";

import { cn } from "@/lib/utils";
import type { CategoryOption } from "./category-grid";
import { FilterChip } from "./filter-chips";
import { IconCategories, IconCheckGlyph } from "./icons";

export type CategoryMultiGridProps = {
  options: CategoryOption[];
  /** Chosen ids (main or sub). Empty = all categories. */
  value: string[];
  onValueChange?: (ids: string[]) => void;
  className?: string;
};

/**
 * Category filter: round icons 48 (like the form picker), 4 per row, pick
 * SEVERAL. "All" first. A chosen main category also covers its
 * subcategories (API rule); then a chip row under the grid lets you narrow
 * it to some subcategories. Chosen = black circle, purple icon, check badge.
 */
export function CategoryMultiGrid({ options, value, onValueChange, className }: CategoryMultiGridProps) {
  const set = new Set(value);
  const subsOf = (o: CategoryOption) => o.children ?? [];
  const mainChosen = (o: CategoryOption) => set.has(o.id) || subsOf(o).some((c) => set.has(c.id));

  const toggleMain = (o: CategoryOption) => {
    const ids = new Set(value);
    if (mainChosen(o)) {
      ids.delete(o.id);
      subsOf(o).forEach((c) => ids.delete(c.id));
    } else ids.add(o.id);
    onValueChange?.([...ids]);
  };
  const pickSub = (o: CategoryOption, subId?: string) => {
    const ids = new Set(value);
    ids.delete(o.id);
    subsOf(o).forEach((c) => ids.delete(c.id));
    if (!subId) ids.add(o.id);
    else {
      const current = value.filter((v) => subsOf(o).some((c) => c.id === v));
      const next = current.includes(subId) ? current.filter((x) => x !== subId) : [...current, subId];
      if (next.length) next.forEach((x) => ids.add(x));
      else ids.add(o.id);
    }
    onValueChange?.([...ids]);
  };

  const tile = (key: string, label: string, icon: React.ReactNode, active: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center gap-[8px] rounded-2xl py-[2px] leading-none outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
    >
      <span
        className={cn(
          "relative flex size-[48px] items-center justify-center rounded-full transition group-active:scale-95 motion-reduce:transition-none [&_svg]:size-[20px]",
          active ? "bg-(--sp-chip-active) text-(--sp-card-front)" : "bg-(--sp-soft) text-(--sp-text) group-hover:bg-(--sp-soft-hover)"
        )}
      >
        {icon}
        {active ? (
          <span className="sp-pop absolute -top-[2px] -right-[2px] flex size-[18px] items-center justify-center rounded-full bg-(--sp-card-front) text-white ring-2 ring-(--sp-panel) [&_svg]:size-[10px]">
            <IconCheckGlyph />
          </span>
        ) : null}
      </span>
      <span className={cn("w-full truncate px-[2px] text-center text-[0.6875rem]", active ? "font-medium text-(--sp-text)" : "text-(--sp-text-2)")}>
        {label}
      </span>
    </button>
  );

  const chosenWithSubs = options.filter((o) => mainChosen(o) && subsOf(o).length);

  return (
    <div className={className}>
      <div className="grid grid-cols-4 gap-y-[14px]">
        {tile("all", "All", <IconCategories />, value.length === 0, () => onValueChange?.([]))}
        {options.map((o) => tile(o.id, o.name, o.icon, mainChosen(o), () => toggleMain(o)))}
      </div>
      {chosenWithSubs.map((o) => {
        const chosenSubs = subsOf(o).filter((c) => set.has(c.id));
        return (
          <div key={o.id} className="mt-[16px] rounded-[16px] bg-(--sp-soft) px-[12px] pt-[10px] pb-[12px]">
            <p className="text-[0.6875rem] leading-none text-(--sp-text-muted)">{o.name}: which ones?</p>
            <div role="group" aria-label={`${o.name} subcategories`} className="mt-[10px] flex flex-wrap gap-[8px]">
              <FilterChip label={`All ${o.name}`} active={chosenSubs.length === 0} onClick={() => pickSub(o)} />
              {subsOf(o).map((c) => (
                <FilterChip key={c.id} label={c.name} active={set.has(c.id)} onClick={() => pickSub(o, c.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
