import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Small parts shared by the login / password pages (not routes).

/** Same look as SpButton (size lg), for a <Link>: the kit button is a <button> only. */
const LINK_BUTTON =
  "inline-flex h-[52px] items-center justify-center gap-[8px] rounded-full px-[24px] text-[14px] leading-none font-medium whitespace-nowrap transition outline-none select-none " +
  "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.98] [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.8]";

export function linkButton(variant: "primary" | "secondary" = "primary", className?: string) {
  return cn(
    LINK_BUTTON,
    variant === "primary"
      ? "bg-(--sp-chip-active) text-(--sp-chip-active-text) hover:opacity-90"
      : "bg-[color-mix(in_oklab,var(--sp-text)_7%,transparent)] text-(--sp-text) hover:bg-[color-mix(in_oklab,var(--sp-text)_11%,transparent)]",
    className
  );
}

/** Message box above a form: red for errors, green for good news. */
export function Notice({ tone, children }: { tone: "danger" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-[16px] px-[16px] py-[14px] text-[0.8125rem] leading-snug",
        tone === "danger"
          ? "bg-[color-mix(in_oklab,var(--sp-danger)_12%,var(--sp-panel))] text-(--sp-danger)"
          : "bg-[color-mix(in_oklab,var(--sp-success)_12%,var(--sp-panel))] text-(--sp-success)"
      )}
    >
      {children}
    </p>
  );
}
