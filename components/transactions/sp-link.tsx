import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Links that look like kit buttons (the kit's SpButton / IconButton are
// <button>s only, and a link must not sit inside a button).

const VARIANT = {
  primary: "bg-(--sp-chip-active) text-(--sp-chip-active-text) hover:opacity-90",
  secondary:
    "bg-[color-mix(in_oklab,var(--sp-text)_7%,transparent)] text-(--sp-text) hover:bg-[color-mix(in_oklab,var(--sp-text)_11%,transparent)]",
} as const;

/** Pill link, same look as SpButton (md = 44, lg = 52). */
export function SpLinkButton({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof VARIANT; size?: "md" | "lg"; icon?: ReactNode }) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-[8px] rounded-full leading-none font-medium whitespace-nowrap transition outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.98]",
        "[&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.8]",
        size === "lg" ? "h-[52px] px-[24px] text-[14px]" : "h-[44px] px-[18px] text-[13px]",
        VARIANT[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </Link>
  );
}

/** Round 44 icon link, same look as IconButton "surface" (e.g. close a form). */
export function SpIconLink({ label, icon, className, ...props }: ComponentProps<typeof Link> & { label: string; icon: ReactNode }) {
  return (
    <Link
      aria-label={label}
      className={cn(
        "inline-flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) transition outline-none hover:brightness-95",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.6]",
        className
      )}
      {...props}
    >
      {icon}
    </Link>
  );
}
