"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconBack, IconCalendar, IconChevronRight, IconCloseGlyph } from "./icons";

export type PeriodBarProps = {
  /** e.g. "November 2026" or "12 Oct – 11 Nov 2026". */
  label: string;
  /**
   * Small gray line under the label, one line (cut with "…" if too long).
   * Text or nodes, e.g. <>2 transactions · <span className="text-(--sp-income)">In $X</span></>.
   */
  summary?: ReactNode;
  /** Month mode: arrows to go to the month before / after. */
  onPrev?: () => void;
  onNext?: () => void;
  canNext?: boolean;
  /**
   * Range mode (a date range or preset is set): no arrows, a calendar icon,
   * and a round × to go back to the month.
   */
  range?: boolean;
  onClearRange?: () => void;
  /** Tap on the label (e.g. open the date picker). */
  onLabelClick?: () => void;
  className?: string;
};

const ROUND =
  "flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) outline-none transition focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 disabled:opacity-35 motion-reduce:transition-none [&_svg]:size-[22px]";

/**
 * The period of the list. Month mode: ‹ November 2026 ›. Range mode (a
 * preset or custom range is on): the range with a calendar icon and a ×,
 * so the month switch never fights with the date filter.
 */
export function PeriodBar({
  label,
  summary,
  onPrev,
  onNext,
  canNext = true,
  range,
  onClearRange,
  onLabelClick,
  className,
}: PeriodBarProps) {
  const center = (
    <button
      type="button"
      onClick={onLabelClick}
      disabled={!onLabelClick}
      className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[16px] px-[8px] py-[2px] text-center outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) disabled:cursor-default"
    >
      <span className="-my-[0.125em] flex max-w-full items-center gap-[6px] text-[1rem] leading-[1.5] font-medium text-(--sp-text)">
        {range ? <IconCalendar className="size-[18px] text-(--sp-card-front)" /> : null}
        <span className="truncate">{label}</span>
      </span>
      {summary ? (
        <span className="mt-[calc(3px-0.125em)] -mb-[0.125em] max-w-full truncate text-[0.6875rem] leading-[1.5] text-(--sp-text-muted)">{summary}</span>
      ) : null}
    </button>
  );

  return (
    <div className={cn("flex min-h-[52px] items-center gap-[8px]", className)}>
      {range ? (
        <>
          <span className="size-[44px] shrink-0" aria-hidden />
          {center}
          <button type="button" aria-label="Back to the month" onClick={onClearRange} className={cn(ROUND, "[&_svg]:size-[14px]")}>
            <IconCloseGlyph />
          </button>
        </>
      ) : (
        <>
          <button type="button" aria-label="Month before" onClick={onPrev} className={ROUND}>
            <IconBack />
          </button>
          {center}
          <button type="button" aria-label="Month after" onClick={onNext} disabled={!canNext} className={ROUND}>
            <IconChevronRight />
          </button>
        </>
      )}
    </div>
  );
}
