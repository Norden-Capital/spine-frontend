import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT = {
  /** White circle on the gray page (light), #292929 on black (dark). Top bar. */
  surface: "bg-(--sp-icon-btn) text-(--sp-icon-btn-text) hover:brightness-95",
  /** Soft circle inside a panel. */
  soft: "bg-(--sp-soft) text-(--sp-text) hover:bg-(--sp-soft-hover)",
  /** Black circle. Strong action. */
  ink: "bg-(--sp-pill) text-(--sp-pill-text) hover:brightness-125",
  /** No circle until hover: "more" (…) buttons inside rows and panels. */
  ghost: "bg-transparent text-(--sp-text) hover:bg-(--sp-soft)",
} as const;

const SIZE = {
  md: "size-[44px] [&_svg]:size-[18px]", // reference: 43–44pt
  lg: "size-[48px] [&_svg]:size-[20px]",
} as const;

export type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  /** Read by screen readers. Required: the button has no visible text. */
  label: string;
  icon: ReactNode;
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
  /** Small dot top-right (e.g. unread notifications). */
  dot?: boolean;
};

/** Round icon-only button, 44px (tap target). */
export function IconButton({
  label,
  icon,
  variant = "surface",
  size = "md",
  dot,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full transition outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:shrink-0 [&_svg]:stroke-[1.6]",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...props}
    >
      {icon}
      {dot ? (
        <span
          aria-hidden
          className="absolute top-[11px] right-[12px] size-[7px] rounded-full bg-(--sp-card-front) ring-2 ring-(--sp-icon-btn)"
        />
      ) : null}
    </button>
  );
}
