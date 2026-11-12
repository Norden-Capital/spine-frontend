"use client";

import { useId, useState } from "react";
import { SignInActivity, SignInHeatmap, type SignInDay as Cell } from "@/components/spine-ui";
import { useDates } from "@/components/prefs/prefs-provider";
import { addDays, WEEKS, type SignInDay } from "@/lib/sign-ins";

/**
 * Last 6 months of sign-ins, one square per day (kit SignInHeatmap: a
 * column is a week, Monday on top; purple = signed in, red = only failed).
 * 26 columns share the width, so it fits a 375px phone with no side scroll.
 *
 * Squares are too small to tap one by one, so instead of a tooltip the day
 * under the finger (tap, or slide along the grid) or mouse is shown in the
 * line under the chart.
 */

function times(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

const failedTries = (n: number) => times(n, "failed try", "failed tries");

function monthLabel(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
}

/**
 * `start`: the Monday of the first column (from the server).
 * `variant`: kit SignInHeatmap (squares) or SignInActivity (big number, round dots).
 */
export function SignInChart({
  days,
  today,
  start,
  variant = "heatmap",
}: {
  days: SignInDay[];
  today: string;
  start: string;
  variant?: "heatmap" | "activity";
}) {
  const dates = useDates();
  const chartId = useId();
  const [picked, setPicked] = useState<string | null>(null);

  const byDate = new Map(days.map((d) => [d.date, d]));
  const inRange = days.filter((d) => d.date >= start && d.date <= today);
  const okDays = inRange.filter((d) => d.ok > 0).length;
  const failed = inRange.reduce((sum, d) => sum + d.failed, 0);

  const cells: Cell[] = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const date = addDays(start, i);
    const day = date > today ? undefined : byDate.get(date);
    return (day?.ok ?? 0) > 0 ? "ok" : (day?.failed ?? 0) > 0 ? "failed" : "none";
  });

  // Month name above the week whose Sunday is in a new month. The first
  // column gets one too, unless the next month starts too close to it.
  const monthOf = (col: number) => addDays(start, col * 7 + 6).slice(0, 7);
  const starts = Array.from({ length: WEEKS }, (_, col) => col).filter(
    (col) => col > 0 && monthOf(col) !== monthOf(col - 1)
  );
  const months = [...((starts[0] ?? WEEKS) >= 3 ? [0] : []), ...starts].map((week) => ({
    label: monthLabel(addDays(start, week * 7 + 6)),
    week,
  }));

  function pickAt(wrapper: HTMLElement, x: number, y: number) {
    const grid = wrapper.querySelector<HTMLElement>('[role="img"]');
    if (!grid) return;
    const r = grid.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    const col = Math.min(WEEKS - 1, Math.floor(((x - r.left) / r.width) * WEEKS));
    const row = Math.min(6, Math.floor(((y - r.top) / r.height) * 7));
    const date = addDays(start, col * 7 + row);
    if (date <= today) setPicked(date);
  }

  const pickedIndex = picked ? Math.round((Date.parse(picked) - Date.parse(start)) / 86_400_000) : -1;
  const pickedDay = picked ? byDate.get(picked) : undefined;

  return (
    <div data-signin-chart={chartId} className="rounded-(--sp-radius) bg-(--sp-panel)">
      {pickedIndex >= 0 && (
        // Ring on the picked square (the kit grid has no "picked" prop).
        <style>{`[data-signin-chart="${chartId}"] [role="img"] > span:nth-child(${pickedIndex + 1}) { outline: 2px solid var(--sp-text); outline-offset: 1px; }`}</style>
      )}
      <div
        className="touch-pan-y select-none"
        onPointerDown={(e) => pickAt(e.currentTarget, e.clientX, e.clientY)}
        onPointerMove={(e) =>
          (e.pointerType === "mouse" || e.buttons > 0) && pickAt(e.currentTarget, e.clientX, e.clientY)
        }
      >
        {variant === "activity" ? (
          <SignInActivity
            days={cells}
            months={months}
            total={okDays}
            totalLabel={okDays === 1 ? "day with a sign-in" : "days with a sign-in"}
            failed={failed}
            className="bg-transparent pb-[12px]"
          />
        ) : (
          <SignInHeatmap
            days={cells}
            months={months}
            summary={`${times(okDays, "day")} · ${failedTries(failed)}`}
            className="bg-transparent pb-[12px]"
          />
        )}
      </div>
      <p
        aria-live="polite"
        className="mx-[14px] mb-[14px] min-h-[40px] rounded-[12px] bg-(--sp-soft) px-[12px] py-[10px] text-[0.75rem] leading-snug"
      >
        {picked ? (
          <>
            <span className="font-medium text-(--sp-text)">{dates.day(picked)}</span>
            <span className="text-(--sp-text-muted)">
              {" · "}
              {pickedDay?.ok ? `Signed in ${times(pickedDay.ok, "time")}` : "No sign-in"}
              {pickedDay?.failed ? ` · ${failedTries(pickedDay.failed)}` : ""}
            </span>
          </>
        ) : (
          <span className="text-(--sp-text-muted)">Tap a square to see that day.</span>
        )}
      </p>
    </div>
  );
}
