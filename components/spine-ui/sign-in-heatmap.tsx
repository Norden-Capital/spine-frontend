import { cn } from "@/lib/utils";

export type SignInDay = "none" | "ok" | "failed";

export type SignInHeatmapProps = {
  /** One entry per day, oldest first, length = weeks × 7 (Monday first). */
  days: SignInDay[];
  /** Month names under the grid, with the week index where each starts. */
  months: { label: string; week: number }[];
  /** e.g. "21 days · 2 failed tries". */
  summary?: string;
  className?: string;
};

const CELL: Record<SignInDay, string> = {
  none: "bg-(--sp-soft)",
  ok: "bg-(--sp-card-front)",
  failed: "bg-(--sp-danger)",
};

/**
 * Sign-in chart (like a contribution grid): one square per day, 7 rows,
 * radius 3, 3 apart; purple = signed in, red = only failed tries.
 * Fills the panel width (26 weeks at 375).
 */
export function SignInHeatmap({ days, months, summary, className }: SignInHeatmapProps) {
  const weeks = Math.ceil(days.length / 7);
  return (
    <section className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[14px] pb-[14px]", className)}>
      <div className="flex items-baseline justify-between gap-3 leading-none">
        <h2 className="text-[0.8125rem] font-medium text-(--sp-text)">Sign-ins</h2>
        {summary ? <span className="text-[0.625rem] text-(--sp-text-muted)">{summary}</span> : null}
      </div>
      <div className="mt-[14px] flex gap-[6px]">
        <div aria-hidden className="grid shrink-0 grid-rows-7 gap-[3px] text-[0.5625rem] leading-none text-(--sp-text-faint)">
          {["Mon", "", "Wed", "", "Fri", "", ""].map((d, i) => (
            <span key={i} className="flex items-center">
              {d}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div
            role="img"
            aria-label={`Sign-ins over the last ${weeks} weeks${summary ? `: ${summary}` : ""}`}
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
          >
            {days.map((d, i) => (
              <span key={i} className={cn("aspect-square rounded-[3px]", CELL[d])} />
            ))}
          </div>
          <div
            aria-hidden
            className="relative mt-[6px] h-[10px] text-[0.5625rem] leading-none text-(--sp-text-faint)"
          >
            {months.map((m) => (
              <span key={m.label} className="absolute top-0" style={{ left: `${(m.week / weeks) * 100}%` }}>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[12px] flex flex-wrap gap-x-[14px] gap-y-[6px] text-[0.625rem] leading-none text-(--sp-text-muted)">
        {(
          [
            ["ok", "Signed in"],
            ["failed", "Only failed"],
            ["none", "None"],
          ] as const
        ).map(([k, l]) => (
          <span key={k} className="flex items-center gap-[6px]">
            <span className={cn("size-[10px] rounded-[3px]", CELL[k])} />
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}
