"use client";

import { useState } from "react";
import { useDates } from "@/components/prefs/prefs-provider";
import { cn } from "@/lib/utils";
import { addDays, chartStart, WEEKS, type SignInDay } from "@/lib/sign-ins";

/**
 * Last 6 months of sign-ins, one square per day (ported from the LMS
 * "My account" year chart). A column is a week, Sunday on top. 26 columns
 * share the width, so it fits a 375px phone with no side scroll.
 *
 * Squares are too small to tap one by one, so instead of a tooltip the day
 * under the finger (tap, or slide along the grid) or mouse is shown in the
 * line under the chart.
 */

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

const TONE = {
  ok: "bg-foreground",
  failed: "bg-destructive",
  none: "bg-foreground/[0.07]",
};

const KEYS = [
  { tone: TONE.ok, label: "Signed in" },
  { tone: TONE.failed, label: "Only failed" },
  { tone: TONE.none, label: "None" },
];

function times(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

const failedTries = (n: number) => times(n, "failed try", "failed tries");

function monthLabel(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
}

export function SignInChart({ days, today }: { days: SignInDay[]; today: string }) {
  const dates = useDates();
  const [picked, setPicked] = useState<string | null>(null);

  const start = chartStart(today);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const inRange = days.filter((d) => d.date >= start && d.date <= today);
  const okDays = inRange.filter((d) => d.ok > 0).length;
  const failed = inRange.reduce((sum, d) => sum + d.failed, 0);

  // Month name under the first week column that starts a new month.
  const months = Array.from({ length: WEEKS }, (_, col) => {
    const first = addDays(start, col * 7);
    const prev = addDays(first, -7);
    return col === 0 || first.slice(5, 7) !== prev.slice(5, 7) ? monthLabel(addDays(first, 6)) : "";
  });

  function pickAt(x: number, y: number) {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-date]");
    if (el?.dataset.date) setPicked(el.dataset.date);
  }

  const pickedDay = picked ? byDate.get(picked) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">Sign-ins</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {times(okDays, "day")} · {failedTries(failed)}
        </p>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-1.5">
        <div className="grid grid-rows-7 gap-[3px] text-[0.625rem] leading-none text-muted-foreground">
          {WEEKDAYS.map((name, row) => (
            <span key={row} className="flex items-center">
              {name}
            </span>
          ))}
        </div>

        <div
          role="img"
          aria-label={`Last 6 months: signed in on ${times(okDays, "day")}, ${failedTries(failed)}.`}
          className="grid touch-pan-y grid-flow-col grid-cols-[repeat(26,minmax(0,1fr))] grid-rows-7 gap-[3px] select-none"
          onPointerDown={(e) => pickAt(e.clientX, e.clientY)}
          onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons > 0) && pickAt(e.clientX, e.clientY)}
        >
          {Array.from({ length: WEEKS * 7 }, (_, i) => {
            const date = addDays(start, i);
            if (date > today) return <span key={date} aria-hidden className="aspect-square" />;
            const day = byDate.get(date);
            const tone = (day?.ok ?? 0) > 0 ? TONE.ok : (day?.failed ?? 0) > 0 ? TONE.failed : TONE.none;
            return (
              <span
                key={date}
                data-date={date}
                className={cn(
                  "aspect-square rounded-[2px]",
                  tone,
                  picked === date && "ring-2 ring-ring ring-offset-1 ring-offset-background"
                )}
              />
            );
          })}
        </div>

        <div />
        <div className="mt-1 grid grid-cols-[repeat(26,minmax(0,1fr))] gap-[3px] text-[0.625rem] leading-none text-muted-foreground">
          {months.map((m, col) => (
            <span key={col} className="overflow-visible whitespace-nowrap">
              {m}
            </span>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="min-h-10 rounded-lg bg-muted px-3 py-2 text-sm">
        {picked ? (
          <>
            <span className="font-medium">{dates.day(picked)}</span>
            <span className="text-muted-foreground">
              {" · "}
              {pickedDay?.ok ? `Signed in ${times(pickedDay.ok, "time")}` : "No sign-in"}
              {pickedDay?.failed ? ` · ${failedTries(pickedDay.failed)}` : ""}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Tap a square to see that day.</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {KEYS.map((key) => (
          <span key={key.label} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-[2px] ring-1 ring-border", key.tone)} aria-hidden />
            {key.label}
          </span>
        ))}
      </div>
    </div>
  );
}
