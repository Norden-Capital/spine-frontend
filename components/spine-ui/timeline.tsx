import { cn } from "@/lib/utils";

export type TimelineEntry = {
  id: string;
  /** e.g. "Edited by Sam Tremblay". */
  title: string;
  /** e.g. "12 Nov 2026, 14:20". */
  meta: string;
  /** What changed, e.g. "Amount: $100.00 → $120.00". */
  changes?: string[];
  /** The newest entry gets a purple dot. */
  current?: boolean;
};

/**
 * History of a transaction: a thin line with dots (10), title 12 /
 * Medium, time 10 gray, changes 11. Newest first.
 */
export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {entries.map((e, i) => (
        <li key={e.id} className="relative flex gap-[12px] pb-[16px] last:pb-0">
          <span aria-hidden className="relative flex w-[10px] shrink-0 justify-center">
            <span
              className={cn(
                "relative z-1 mt-[2px] size-[10px] rounded-full",
                e.current ? "bg-(--sp-card-front)" : "bg-(--sp-text-faint)"
              )}
            />
            {i < entries.length - 1 ? (
              <span className="absolute top-[14px] -bottom-[2px] w-[2px] rounded-full bg-(--sp-soft)" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1 leading-none">
            <p className="text-[0.75rem] font-medium text-(--sp-text)">{e.title}</p>
            <p className="mt-[4px] text-[0.625rem] text-(--sp-text-faint)">{e.meta}</p>
            {e.changes?.length ? (
              <ul className="mt-[8px] space-y-[4px]">
                {e.changes.map((c) => (
                  <li key={c} className="text-[0.6875rem] leading-snug break-words text-(--sp-text-muted)">
                    {c}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
