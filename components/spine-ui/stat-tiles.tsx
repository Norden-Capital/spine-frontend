import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconTile, type IconTileTone } from "./icon-tile";

export type StatTile = {
  icon: ReactNode;
  tone?: IconTileTone;
  /** Big value, e.g. "18" or "Today". */
  value: string;
  /** Small label, e.g. "Sign-ins this month". */
  label: string;
};

/**
 * Row of small stat tiles (3 at 375): white panel, radius 18, icon tile 33,
 * value 15 / SemiBold, label 10 gray. Read-only facts, not buttons.
 */
export function StatTiles({ items, className }: { items: StatTile[]; className?: string }) {
  return (
    <dl className={cn("grid gap-[8px]", className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((s) => (
        <div key={s.label} className="flex min-w-0 flex-col rounded-[18px] bg-(--sp-panel) px-[12px] pt-[12px] pb-[12px]">
          <IconTile tone={s.tone} size={33}>
            {s.icon}
          </IconTile>
          <dd className="mt-[calc(12px-0.25em)] -mb-[0.25em] truncate text-[0.9375rem] leading-[1.5] font-semibold text-(--sp-text) tabular-nums">
            {s.value}
          </dd>
          <dt className="mt-[calc(5px-0.125em)] -mb-[0.125em] text-[0.625rem] leading-[1.5] text-(--sp-text-muted)">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
