"use client";

import type { ReactNode } from "react";
import { DueBadge, IconButton, IconMore, SpBadge } from "@/components/spine-ui";
import { useDates } from "@/components/prefs/prefs-provider";
import { dueState, repeatLabel, shortDay } from "@/lib/repeat-schedule";
import { formatMoney } from "@/lib/transactions-types";
import { cn } from "@/lib/utils";
import type { RepeatView } from "./repeat-sheet";

/**
 * One repeat item in a list (wallet Recurring + company Repeat expenses):
 * logo, name, amount, "Every 3 months · next Fri 12 Feb" + urgency badge,
 * and the "…" button that opens the detail sheet. `children` = extra
 * actions under it (company: Add expense / Skip this time).
 */
export function RepeatRow({
  view: v,
  today,
  onMore,
  children,
}: {
  view: RepeatView;
  today: string;
  onMore: () => void;
  children?: ReactNode;
}) {
  const dates = useDates();
  const fmt = { dateFormat: dates.settings.dateFormat, today };
  const finished = v.nextDate === null;
  const due = dueState(v.nextDate, today, { paused: v.paused, pausedUntil: v.pausedUntil, dateFormat: fmt.dateFormat });
  const pausedNow = due?.state === "paused";
  const income = v.type === "INCOME";

  return (
    <li
      data-testid="repeat-row"
      data-id={v.id}
      className={cn(
        "flex flex-col gap-[12px] rounded-(--sp-radius) bg-(--sp-panel) py-[12px] pr-[6px] pl-[14px]",
        (pausedNow || finished) && "opacity-80"
      )}
    >
      <div className="flex items-start gap-[10.8px]">
        <span className="mt-[2px] flex size-[40px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) [&_svg]:size-[17px] [&_svg]:stroke-[1.6]">
          {v.logo}
        </span>
        <div className="min-w-0 flex-1 pt-[2px]">
          <div className="flex items-baseline gap-[8px]">
            <p className="min-w-0 flex-1 truncate text-[0.875rem] leading-tight font-medium text-(--sp-text)">{v.name}</p>
            <span
              className={cn(
                "shrink-0 text-[0.875rem] leading-tight font-semibold whitespace-nowrap tabular-nums",
                income ? "text-(--sp-income)" : "text-(--sp-text)"
              )}
            >
              {formatMoney(v.amount, income ? "+" : v.minusForExpense ? "-" : undefined)}
            </span>
          </div>
          <div className="mt-[6px] flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
            <span className="min-w-0 truncate text-[0.6875rem] leading-tight text-(--sp-text-muted)" data-testid="repeat-row-when">
              {repeatLabel(v.unit, v.every)}
              {finished ? " · finished" : pausedNow ? "" : ` · next ${shortDay(v.nextDate!, fmt)}`}
            </span>
            {finished ? (
              <SpBadge>Finished</SpBadge>
            ) : (
              due && due.state !== "later" && <DueBadge state={due.state} label={due.label} />
            )}
          </div>
        </div>
        <IconButton
          variant="ghost"
          label={`More for ${v.name}`}
          icon={<IconMore />}
          onClick={onMore}
          className="-mt-[4px]"
          data-testid="repeat-more"
        />
      </div>
      {children}
    </li>
  );
}
