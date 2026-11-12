import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown } from "./icons";

export type SpFieldProps = {
  label: string;
  /** id of the input, for the <label>. */
  htmlFor?: string;
  /** Small gray help text under the input. */
  hint?: string;
  /** Red text under the input (also mark the input aria-invalid). */
  error?: string;
  /** Shows "(optional)" after the label. */
  optional?: boolean;
  /** Right of the label, e.g. a small link. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Label 13 / Medium, 8 above the input; hint / error 11 under it. */
export function SpField({ label, htmlFor, hint, error, optional, aside, children, className }: SpFieldProps) {
  return (
    <div className={cn("space-y-[8px]", className)}>
      <div className="flex items-baseline justify-between gap-3 px-[4px]">
        <label htmlFor={htmlFor} className="-my-[0.125em] text-[0.8125rem] leading-[1.5] font-medium text-(--sp-text)">
          {label}
          {optional ? <span className="font-normal text-(--sp-text-faint)"> (optional)</span> : null}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">{error}</p>
      ) : hint ? (
        <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * The ONE input look of the kit (text, number, password, search, date,
 * select, textarea): soft see-through fill, radius 16, no border, 16px
 * text. Same on the gray page and inside white panels / sheets.
 * Use it for any hand-made input-like control.
 */
export const SP_INPUT_CLASS =
  "w-full rounded-[16px] bg-(--sp-input) text-(--sp-text) outline-none transition hover:bg-(--sp-input-hover) " +
  "placeholder:text-(--sp-input-placeholder) focus-visible:ring-2 focus-visible:ring-(--sp-card-front) " +
  "aria-invalid:ring-2 aria-invalid:ring-(--sp-danger) data-invalid:ring-2 data-invalid:ring-(--sp-danger) " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-(--sp-input) read-only:text-(--sp-text-muted) " +
  "motion-reduce:transition-none";

/** Kept so old callers still compile. It does nothing now: there is one input look. */
type LegacySurface = { /** @deprecated No effect: one input look everywhere. */ surface?: "page" | "panel" };

export type SpInputProps = ComponentProps<"input"> &
  LegacySurface & {
    /** Icon inside, on the left (e.g. search). */
    icon?: ReactNode;
    /** Element inside, on the right (e.g. eye button), 44 wide. */
    end?: ReactNode;
  };

/** Text input: 52 tall, the kit input look. Text at least 16px so phones do not zoom. */
export function SpInput({ icon, end, surface: _surface, className, ...props }: SpInputProps) {
  void _surface;
  const input = (
    <input
      className={cn(SP_INPUT_CLASS, "h-[52px] px-[16px]", icon ? "pl-[44px]" : "", end ? "pr-[48px]" : "", className)}
      {...props}
    />
  );
  if (!icon && !end) return input;
  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute top-1/2 left-[16px] -translate-y-1/2 text-(--sp-input-icon) [&_svg]:size-[18px] [&_svg]:stroke-[1.8]">
          {icon}
        </span>
      ) : null}
      {input}
      {end ? <span className="absolute top-1/2 right-[4px] -translate-y-1/2">{end}</span> : null}
    </div>
  );
}

export type SpTextareaProps = ComponentProps<"textarea"> & LegacySurface;

/** Multi-line input, same look as SpInput, 96 tall at least. */
export function SpTextarea({ surface: _surface, className, ...props }: SpTextareaProps) {
  void _surface;
  return <textarea className={cn(SP_INPUT_CLASS, "min-h-[96px] resize-none px-[16px] py-[14px] leading-snug", className)} {...props} />;
}

export type SpSelectOption = { value: string; label: string; disabled?: boolean };

export type SpSelectProps = Omit<ComponentProps<"select">, "children"> &
  LegacySurface & {
    /** The choices. Or pass <option>s as children. */
    options?: SpSelectOption[];
    /** First, empty choice (value ""), e.g. "Choose a category". */
    placeholder?: string;
    children?: ReactNode;
  };

/**
 * Select in the kit input look: 52 tall, a chevron on the right. Uses the
 * phone's own picker (best on mobile). Gray text while the empty choice is on.
 */
export function SpSelect({ options, placeholder, children, surface: _surface, className, ...props }: SpSelectProps) {
  void _surface;
  const empty = props.value === "" || (props.value === undefined && props.defaultValue === undefined && !!placeholder);
  return (
    <div className="relative">
      <select
        className={cn(
          SP_INPUT_CLASS,
          "h-[52px] appearance-none truncate pr-[44px] pl-[16px]",
          empty && "text-(--sp-input-placeholder)",
          className
        )}
        {...props}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options?.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <IconChevronDown className="pointer-events-none absolute top-1/2 right-[16px] size-[18px] -translate-y-1/2 text-(--sp-input-icon)" />
    </div>
  );
}
