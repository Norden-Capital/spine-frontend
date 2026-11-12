"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { IconBack, IconChevronRight } from "./icons";

/** "YYYY-MM-DD" (local, no time zone shifts). */
export type IsoDay = string;

type Common = {
  /** Today ("YYYY-MM-DD"): purple dot, and the default month. */
  today: IsoDay;
  /** Days before this are off. */
  min?: IsoDay;
  /** Days after this are off. Range mode default: today (no future). Single mode default: no limit. */
  max?: IsoDay;
  /** Month shown first ("YYYY-MM"). Default: the month of the value / start, else today. */
  initialMonth?: string;
  /** Weeks start on Monday (default) or Sunday. */
  weekStart?: 1 | 0;
  className?: string;
};

export type DateRangePickerProps = Common &
  (
    | {
        /** Range (default): first tap = start, second tap = end (swapped if before). */
        mode?: "range";
        from?: IsoDay;
        to?: IsoDay;
        onChange?: (range: { from?: IsoDay; to?: IsoDay }) => void;
      }
    | {
        /** One day. */
        mode: "single";
        value?: IsoDay | null;
        onSelect?: (day: IsoDay) => void;
      }
  );

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const addDays = (day: IsoDay, n: number) => {
  const dt = new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)) + n);
  return iso(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

/**
 * Kit calendar (replaces every browser date input). One month, ‹ › to
 * move, 7 columns of 44 tall day cells, always 6 weeks (one fixed size;
 * days of the next / previous month are muted, tap one = pick it and go
 * to its month). Range mode (filters): start / end =
 * black circles, the days between = a soft band. Single mode (forms): the
 * chosen day = black circle. Today = purple dot. Days outside min / max
 * are off. Keyboard: arrows move by day / week (across months), Enter /
 * Space picks, PageUp / PageDown change month.
 */
export function DateRangePicker(props: DateRangePickerProps) {
  const { today, min, initialMonth, weekStart = 1, className } = props;
  const single = props.mode === "single";
  const max = props.max ?? (single ? undefined : today);
  const from = single ? undefined : props.from;
  const to = single ? undefined : props.to;
  const value = single ? (props.value ?? undefined) : undefined;

  const firstShown = initialMonth ?? (value ?? from ?? today).slice(0, 7);
  const [ym, setYm] = useState(firstShown);
  const [focusDay, setFocusDay] = useState<IsoDay | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7)) - 1;
  const first = new Date(y, m, 1).getDay(); // 0 = Sunday
  const lead = weekStart === 1 ? (first + 6) % 7 : first;
  const count = new Date(y, m + 1, 0).getDate();
  // Always 6 weeks (42 days), so the calendar never changes height. Days of
  // the month before / after fill the gaps, muted.
  const gridStart = addDays(iso(y, m, 1), -lead);
  const cells: IsoDay[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const off = (day: IsoDay) => (min !== undefined && day < min) || (max !== undefined && day > max);
  const move = (d: number) => {
    const dt = new Date(y, m + d, 1);
    setYm(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`);
  };
  const canPrev = min === undefined || `${ym}-01` > min.slice(0, 7) + "-01";
  const canNext = max === undefined || `${ym}-01` < max.slice(0, 7) + "-01";

  const pick = (day: IsoDay) => {
    if (off(day)) return;
    if (day.slice(0, 7) !== ym) setYm(day.slice(0, 7));
    if (props.mode === "single") return props.onSelect?.(day);
    const onChange = props.onChange;
    if (!onChange) return;
    if (!from || (from && to)) onChange({ from: day, to: undefined });
    else if (day < from) onChange({ from: day, to: from });
    else onChange({ from, to: day });
  };

  // Keyboard focus: one day is tabbable (chosen day, else today, else the 1st).
  const tabDay = (() => {
    const inMonth = (d?: IsoDay) => d && d.slice(0, 7) === ym && !off(d);
    if (focusDay && focusDay.slice(0, 7) === ym) return focusDay;
    for (const d of [value, to, from, today]) if (inMonth(d)) return d!;
    for (let d = 1; d <= count; d++) if (!off(iso(y, m, d))) return iso(y, m, d);
    return iso(y, m, 1);
  })();

  useEffect(() => {
    if (!focusDay) return;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [focusDay, ym]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>, day: IsoDay) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    let next: IsoDay | null = null;
    if (step) next = addDays(day, step);
    else if (e.key === "PageUp" || e.key === "PageDown") {
      const dt = new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1 + (e.key === "PageUp" ? -1 : 1), 1);
      const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
      next = iso(dt.getFullYear(), dt.getMonth(), Math.min(Number(day.slice(8, 10)), last));
    } else if (e.key === "Home") next = addDays(day, -((new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))).getDay() - weekStart + 7) % 7));
    else if (e.key === "End") next = addDays(day, 6 - ((new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10))).getDay() - weekStart + 7) % 7));
    if (!next) return;
    e.preventDefault();
    if (off(next)) return;
    if (next.slice(0, 7) !== ym) setYm(next.slice(0, 7));
    setFocusDay(next);
  };

  const labels = weekStart === 1 ? DAYS : [DAYS[6], ...DAYS.slice(0, 6)];
  const navBtn =
    "flex size-[44px] items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) disabled:opacity-35 [&_svg]:size-[22px]";

  return (
    <div className={cn("select-none", className)}>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Month before" onClick={() => move(-1)} disabled={!canPrev} className={navBtn}>
          <IconBack />
        </button>
        <p className="min-w-0 flex-1 truncate px-[8px] text-center text-[0.9375rem] leading-[1.5] font-medium whitespace-nowrap text-(--sp-text)" aria-live="polite">
          {MONTHS[m]} {y}
        </p>
        <button type="button" aria-label="Month after" onClick={() => move(1)} disabled={!canNext} className={navBtn}>
          <IconChevronRight />
        </button>
      </div>
      <div className="mt-[12px] grid grid-cols-7 text-center text-[0.625rem] leading-[1.5] font-medium text-(--sp-text-faint)" aria-hidden>
        {labels.map((d) => (
          <span key={d} className="py-[calc(6px-0.25em)]">
            {d}
          </span>
        ))}
      </div>
      <div ref={grid} role="grid" aria-label={`${MONTHS[m]} ${y}`} className="mt-[4px] grid grid-cols-7 gap-y-[2px]">
        {cells.map((day, i) => {
          const d = Number(day.slice(8, 10));
          const dm = Number(day.slice(5, 7)) - 1;
          const dy = Number(day.slice(0, 4));
          const outside = day.slice(0, 7) !== ym;
          const isStart = !single && day === from;
          const isEnd = !single && day === to;
          const chosen = single && day === value;
          const inside = !single && !!from && !!to && day > from && day < to;
          const edge = isStart || isEnd || chosen;
          const disabled = off(day);
          const col = i % 7;
          return (
            <span
              key={day}
              className={cn(
                "relative flex h-[44px] items-center justify-center",
                (inside || (isStart && to) || (isEnd && from && from !== to)) &&
                  "before:absolute before:inset-y-[4px] before:bg-[color-mix(in_oklab,var(--sp-card-front)_16%,transparent)] before:content-['']",
                inside && "before:inset-x-0",
                isStart && to && "before:right-0 before:left-1/2",
                isEnd && from && from !== to && "before:right-1/2 before:left-0",
                inside && col === 0 && "before:left-[4px] before:rounded-l-full",
                inside && col === 6 && "before:right-[4px] before:rounded-r-full"
              )}
            >
              <button
                type="button"
                data-day={day}
                disabled={disabled}
                tabIndex={day === tabDay ? 0 : -1}
                aria-pressed={edge}
                aria-current={day === today ? "date" : undefined}
                aria-label={`${d} ${MONTHS[dm]} ${dy}${isStart ? ", start" : ""}${isEnd ? ", end" : ""}${chosen ? ", chosen" : ""}${day === today ? ", today" : ""}`}
                onClick={() => pick(day)}
                onKeyDown={(e) => onKey(e as unknown as KeyboardEvent<HTMLDivElement>, day)}
                onFocus={() => setFocusDay(day)}
                className={cn(
                  "relative z-1 flex size-[40px] items-center justify-center rounded-full text-[0.8125rem] leading-[1.5] tabular-nums outline-none transition focus-visible:ring-3 focus-visible:ring-(--sp-ring) disabled:opacity-30 motion-reduce:transition-none",
                  edge
                    ? "bg-(--sp-chip-active) font-semibold text-(--sp-chip-active-text)"
                    : inside
                      ? "font-medium text-(--sp-text)"
                      : outside
                        ? "text-(--sp-text-faint) hover:bg-(--sp-soft)"
                        : "text-(--sp-text) hover:bg-(--sp-soft)"
                )}
              >
                {d}
                {day === today && !edge ? (
                  <span aria-hidden className="absolute bottom-[5px] size-[4px] rounded-full bg-(--sp-card-front)" />
                ) : null}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Same component, for single dates: `<Calendar mode="single" value onSelect today min max />`. */
export const Calendar = DateRangePicker;
