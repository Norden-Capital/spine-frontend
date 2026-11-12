import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InfoRow = { label: string; value: ReactNode };

export type InfoListProps = {
  rows: InfoRow[];
  /** Panel title, like SectionCard. */
  title?: string;
  className?: string;
};

/**
 * Facts about one thing (category, created, role…): label left in
 * gray, value right. 44 per row, no lines (kit rule), inside a panel.
 */
export function InfoList({ rows, title, className }: InfoListProps) {
  return (
    <section className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[14px] py-[6px]", className)}>
      {title ? (
        <h2 className="-my-[0.25em] pt-[12px] pb-[4px] text-[0.8125rem] leading-[1.5] font-medium text-(--sp-text)">{title}</h2>
      ) : null}
      <dl>
        {rows.map((r) => (
          <div key={r.label} className="flex min-h-[44px] items-center justify-between gap-[16px] py-[8px]">
            <dt className="shrink-0 text-[0.75rem] leading-snug text-(--sp-text-muted)">{r.label}</dt>
            <dd className="min-w-0 text-right text-[0.8125rem] leading-snug font-medium break-words text-(--sp-text)">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
