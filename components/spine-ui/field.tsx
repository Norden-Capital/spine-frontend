import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        <label htmlFor={htmlFor} className="text-[0.8125rem] leading-tight font-medium text-(--sp-text)">
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

const INPUT =
  "w-full rounded-[16px] bg-(--sp-panel) text-(--sp-text) outline-none transition placeholder:text-(--sp-text-faint) " +
  "focus-visible:ring-2 focus-visible:ring-(--sp-card-front) aria-invalid:ring-2 aria-invalid:ring-(--sp-danger) " +
  "disabled:text-(--sp-text-muted) disabled:opacity-70 read-only:text-(--sp-text-muted)";

export type SpInputProps = ComponentProps<"input"> & {
  /** Icon inside, on the left (e.g. search). */
  icon?: ReactNode;
  /** Element inside, on the right (e.g. eye button), 44 wide. */
  end?: ReactNode;
  /** "page" = white on the gray page (default); "panel" = soft inside a white panel or sheet. */
  surface?: "page" | "panel";
};

/**
 * Text input: 52 tall, radius 16, no border (white on gray like the
 * panels). Text is at least 16px so phones do not zoom (globals.css).
 */
export function SpInput({ icon, end, surface = "page", className, ...props }: SpInputProps) {
  const input = (
    <input
      className={cn(
        INPUT,
        "h-[52px] px-[16px]",
        surface === "panel" && "bg-(--sp-soft)",
        icon ? "pl-[44px]" : "",
        end ? "pr-[48px]" : "",
        className
      )}
      {...props}
    />
  );
  if (!icon && !end) return input;
  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute top-1/2 left-[16px] -translate-y-1/2 text-(--sp-text-faint) [&_svg]:size-[18px] [&_svg]:stroke-[1.8]">
          {icon}
        </span>
      ) : null}
      {input}
      {end ? <span className="absolute top-1/2 right-[4px] -translate-y-1/2">{end}</span> : null}
    </div>
  );
}

export type SpTextareaProps = ComponentProps<"textarea"> & { surface?: "page" | "panel" };

/** Multi-line input, same look as SpInput, 96 tall at least. */
export function SpTextarea({ surface = "page", className, ...props }: SpTextareaProps) {
  return (
    <textarea
      className={cn(
        INPUT,
        "min-h-[96px] resize-none px-[16px] py-[14px] leading-snug",
        surface === "panel" && "bg-(--sp-soft)",
        className
      )}
      {...props}
    />
  );
}
