"use client";

import { useId, useState } from "react";
import { FilterChip, Segmented } from "@/components/spine-ui";
import {
  clampEvery,
  isPreset,
  REPEAT_LIMITS,
  REPEAT_PRESETS,
  REPEAT_UNITS,
  repeatLabel,
  unitWord,
  type RepeatUnit,
} from "@/lib/repeat-schedule";
import { cn } from "@/lib/utils";

const UNIT_LABEL: Record<RepeatUnit, string> = { DAY: "Days", WEEK: "Weeks", MONTH: "Months", YEAR: "Years" };

/**
 * "How often" (wallet recurring + company repeat expenses): quick choices
 * as chips (Weekly … Yearly) + Custom… ("Every [N] [days/weeks/months/years]").
 * An item that matches a quick choice opens on it, else on Custom.
 * `error` = the backend's 400 for unit / every, shown under the field.
 */
export function FrequencyPicker({
  unit,
  every,
  onChange,
  error,
  className,
}: {
  unit: RepeatUnit;
  every: number;
  onChange: (unit: RepeatUnit, every: number) => void;
  error?: string;
  className?: string;
}) {
  const ids = useId();
  const [custom, setCustom] = useState(() => !isPreset(unit, every));
  const [everyText, setEveryText] = useState(String(every));
  const limits = REPEAT_LIMITS[unit];

  function pickPreset(u: RepeatUnit, n: number) {
    setCustom(false);
    setEveryText(String(n));
    onChange(u, n);
  }

  function changeEvery(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    if (!digits) {
      setEveryText("");
      return;
    }
    const n = clampEvery(unit, Number(digits));
    setEveryText(Number(digits) > limits.max ? String(n) : digits);
    onChange(unit, n);
  }

  function changeUnit(u: RepeatUnit) {
    const n = clampEvery(u, Number(everyText) || every);
    setEveryText(String(n));
    onChange(u, n);
  }

  return (
    <div className={cn("space-y-[8px]", className)} data-testid="frequency-picker">
      <p id={`${ids}-label`} className="px-[4px] text-[0.8125rem] leading-tight font-medium text-(--sp-text)">
        How often
      </p>
      <div role="group" aria-labelledby={`${ids}-label`} className="chip-row">
        {REPEAT_PRESETS.map((p) => (
          <FilterChip
            key={`${p.unit}/${p.every}`}
            surface="panel"
            label={repeatLabel(p.unit, p.every)}
            active={!custom && p.unit === unit && p.every === every}
            onClick={() => pickPreset(p.unit, p.every)}
            data-testid="frequency-preset"
            data-value={`${p.unit}/${p.every}`}
          />
        ))}
        <FilterChip
          surface="panel"
          label="Custom…"
          active={custom}
          onClick={() => setCustom(true)}
          data-testid="frequency-custom"
        />
      </div>

      {custom && (
        <div className="space-y-[8px] rounded-[16px] bg-(--sp-soft) p-[10px]" data-testid="frequency-custom-fields">
          <div className="flex items-center gap-[10px]">
            <label htmlFor={`${ids}-every`} className="shrink-0 text-[0.8125rem] font-medium text-(--sp-text)">
              Every
            </label>
            <input
              id={`${ids}-every`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={everyText}
              onChange={(e) => changeEvery(e.target.value)}
              onBlur={() => setEveryText(String(every))}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={`${ids}-hint`}
              data-testid="frequency-every"
              className="h-[52px] w-[84px] shrink-0 rounded-[16px] bg-(--sp-panel) px-[14px] text-center text-[16px] text-(--sp-text) tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front) aria-invalid:ring-2 aria-invalid:ring-(--sp-danger)"
            />
            <span className="min-w-0 truncate text-[0.8125rem] text-(--sp-text-muted)">{unitWord(unit, every)}</span>
          </div>
          <div data-testid="frequency-unit">
            <Segmented
              label="Unit"
              surface="page"
              value={unit}
              onValueChange={(v) => changeUnit(v as RepeatUnit)}
              items={REPEAT_UNITS.map((u) => ({ value: u, label: UNIT_LABEL[u] }))}
            />
          </div>
          <p id={`${ids}-hint`} className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            {repeatLabel(unit, every)}. From {limits.min} to {limits.max} {unitWord(unit, limits.max)}.
          </p>
        </div>
      )}
      {error && <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">{error}</p>}
    </div>
  );
}
