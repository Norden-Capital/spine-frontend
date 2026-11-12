import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT = {
  /** Black pill (light) / white pill (dark): the one main action. */
  primary: "bg-(--sp-chip-active) text-(--sp-chip-active-text) hover:opacity-90",
  /** Soft pill: second action. Text color at 7%, so it shows on the page, a panel or a sheet. */
  secondary:
    "bg-[color-mix(in_oklab,var(--sp-text)_7%,transparent)] text-(--sp-text) hover:bg-[color-mix(in_oklab,var(--sp-text)_11%,transparent)]",
  /** Red text on the same soft fill: delete, sign out. */
  danger:
    "bg-[color-mix(in_oklab,var(--sp-danger)_10%,transparent)] text-(--sp-danger) hover:bg-[color-mix(in_oklab,var(--sp-danger)_15%,transparent)]",
  /** Purple: on purpose only (e.g. "Unlock wallet"). */
  accent: "bg-(--sp-card-front) text-(--sp-card-front-text) hover:brightness-110",
} as const;

export type SpButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT;
  /** "lg" = 52 (sheets, forms, full width); "md" = 44. */
  size?: "lg" | "md";
  icon?: ReactNode;
};

/** Pill button in the kit style: full round, 14 / Medium, no border. */
export function SpButton({
  variant = "primary",
  size = "lg",
  icon,
  className,
  children,
  type = "button",
  ...props
}: SpButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-[8px] rounded-full leading-[1.5] font-medium whitespace-nowrap transition outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-40",
        "[&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.8]",
        size === "lg" ? "h-[52px] px-[24px] text-[14px]" : "h-[44px] px-[18px] text-[13px]",
        VARIANT[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
