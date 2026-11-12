"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./bottom-sheet";
import { DateRangePicker, type IsoDay } from "./date-range-picker";
import { IconCalendar } from "./icons";
import { SpButton } from "./sp-button";
import { SP_INPUT_CLASS } from "./field";

const pad = (n: number) => String(n).padStart(2, "0");
/** Local today as "YYYY-MM-DD". */
export function todayIso(): IsoDay {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Default display: "Thu 12 Nov 2026". Pass `format` to use the user's date format. */
function defaultFormat(day: IsoDay) {
  const dt = new Date(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
  const wd = dt.toLocaleDateString("en-GB", { weekday: "short" });
  const mo = dt.toLocaleDateString("en-GB", { month: "short" });
  return `${wd} ${dt.getDate()} ${mo} ${dt.getFullYear()}`;
}

export type DateFieldProps = {
  label: string;
  value: IsoDay | null | undefined;
  onChange: (day: IsoDay | null) => void;
  min?: IsoDay;
  max?: IsoDay;
  /** Shown when there is no date. */
  placeholder?: string;
  /** Adds "(optional)" and a "Clear" button in the sheet. */
  optional?: boolean;
  error?: string;
  hint?: string;
  /** @deprecated No effect: one input look everywhere. */
  surface?: "page" | "panel";
  /** How a date shows, e.g. the user's format: (iso) => "12/11/2026". */
  format?: (day: IsoDay) => string;
  /** Today (purple dot, first month shown). Default: the device's today. */
  today?: IsoDay;
  /** Sheet title. Default: the label. */
  sheetTitle?: string;
  /** Also posts the value in a normal <form> (hidden input). */
  name?: string;
  disabled?: boolean;
  /** Where the sheet renders (previews keep their theme). Default <body>. */
  container?: HTMLElement | null;
  className?: string;
};

/**
 * A date input in the kit style: looks like SpInput (52, 16px text, a
 * calendar icon), shows the date in the user's format, and tap opens the
 * kit calendar in a bottom sheet with "Done" (and "Clear" when optional).
 * Replaces every browser date input.
 */
export function DateField({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = "Choose a date",
  optional,
  error,
  hint,
  format = defaultFormat,
  today,
  sheetTitle,
  name,
  disabled,
  container,
  className,
}: DateFieldProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<IsoDay | null>(value ?? null);
  const now = today ?? todayIso();
  const shown = value ? format(value) : "";

  const openSheet = () => {
    setDraft(value ?? null);
    setOpen(true);
  };

  return (
    <div className={cn("space-y-[8px]", className)}>
      <div className="flex items-baseline justify-between gap-3 px-[4px]">
        <span id={`${id}-label`} className="-my-[0.125em] text-[0.8125rem] leading-[1.5] font-medium text-(--sp-text)">
          {label}
          {optional ? <span className="font-normal text-(--sp-text-faint)"> (optional)</span> : null}
        </span>
      </div>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        data-invalid={error ? "" : undefined}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        className={cn(
          SP_INPUT_CLASS,
          "flex h-[52px] items-center gap-[10px] px-[16px] text-left"
        )}
      >
        <span className="min-w-0 flex-1 truncate" style={{ fontSize: "max(16px, 1rem)" }}>
          {shown ? <span className="text-(--sp-text)">{shown}</span> : <span className="text-(--sp-input-placeholder)">{placeholder}</span>}
        </span>
        <IconCalendar className="size-[20px] text-(--sp-input-icon)" />
      </button>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      {error ? (
        <p id={`${id}-help`} className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-help`} className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
          {hint}
        </p>
      ) : null}

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        container={container}
        title={sheetTitle ?? label}
        description={draft ? format(draft) : "Tap a day."}
        footer={
          <div className={cn("grid gap-[8px]", optional ? "grid-cols-[1fr_2fr]" : "grid-cols-1")}>
            {optional ? (
              <SpButton
                variant="secondary"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                Clear
              </SpButton>
            ) : null}
            <SpButton
              disabled={!draft}
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              Done
            </SpButton>
          </div>
        }
      >
        <DateRangePicker mode="single" today={now} min={min} max={max} value={draft} onSelect={setDraft} />
      </BottomSheet>
    </div>
  );
}
