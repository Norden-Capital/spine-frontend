import { cn } from "@/lib/utils";
import type { SignInDay } from "./sign-in-heatmap";

export type SignInActivityProps = {
  /** One entry per day, oldest first, weeks × 7 (Monday first). */
  days: SignInDay[];
  months: { label: string; week: number }[];
  /** Big number, e.g. 98 (days with a sign-in). */
  total: number;
  /** e.g. "days with a sign-in · last 6 months". */
  totalLabel: string;
  /** Failed tries; shows a red pill when > 0. */
  failed?: number;
  className?: string;
};

const DOT: Record<SignInDay, string> = {
  none: "bg-[color-mix(in_oklab,var(--sp-text)_8%,transparent)]",
  ok: "bg-(--sp-card-front)",
  failed: "bg-(--sp-danger)",
};

/**
 * Premium sign-in chart: a big number on top (30 / Medium), a red pill
 * for failed tries, then the year-style grid as round dots on a soft
 * inner card. Same data as SignInHeatmap.
 */
export function SignInActivity({ days, months, total, totalLabel, failed = 0, className }: SignInActivityProps) {
  const weeks = Math.ceil(days.length / 7);
  return (
    <section className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[16px] pb-[14px]", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="leading-none">
          <h2 className="text-[0.8125rem] font-medium text-(--sp-text)">Sign-ins</h2>
          <p className="mt-[12px] flex items-baseline gap-[8px]">
            <span className="text-[1.875rem] font-medium tracking-tight text-(--sp-text) tabular-nums">{total}</span>
            <span className="text-[0.6875rem] text-(--sp-text-muted)">{totalLabel}</span>
          </p>
        </div>
        {failed > 0 ? (
          <span className="inline-flex h-[24px] shrink-0 items-center gap-[5px] rounded-full bg-[color-mix(in_oklab,var(--sp-danger)_14%,transparent)] px-[10px] text-[0.625rem] leading-none font-medium text-(--sp-danger)">
            <span className="size-[6px] rounded-full bg-(--sp-danger)" />
            {failed} failed {failed === 1 ? "try" : "tries"}
          </span>
        ) : (
          <span className="inline-flex h-[24px] shrink-0 items-center rounded-full bg-[color-mix(in_oklab,var(--sp-success)_14%,transparent)] px-[10px] text-[0.625rem] leading-none font-medium text-(--sp-success)">
            No failed tries
          </span>
        )}
      </div>
      <div className="mt-[14px] rounded-[16px] bg-(--sp-soft) px-[10px] pt-[12px] pb-[10px]">
        <div
          role="img"
          aria-label={`${total} ${totalLabel}${failed ? `, ${failed} failed tries` : ""}`}
          className="grid grid-flow-col grid-rows-7 gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
        >
          {days.map((d, i) => (
            <span key={i} className={cn("aspect-square rounded-full", DOT[d])} />
          ))}
        </div>
        <div aria-hidden className="relative mt-[8px] h-[10px] text-[0.5625rem] leading-none text-(--sp-text-faint)">
          {months.map((m) => (
            <span key={m.label} className="absolute top-0" style={{ left: `${(m.week / weeks) * 100}%` }}>
              {m.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-[12px] flex gap-[14px] text-[0.625rem] leading-none text-(--sp-text-muted)">
        {(
          [
            ["ok", "Signed in"],
            ["failed", "Only failed"],
            ["none", "None"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className="flex items-center gap-[6px]">
            <span className={cn("size-[9px] rounded-full", DOT[k])} />
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}
