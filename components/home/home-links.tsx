import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SpineLogo } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

// Link versions of the kit's AddPill / QuickAction (the kit ships buttons;
// these go to a page). Same sizes and tokens as components/spine-ui.

/** Black "+ label" pill (116 × 48), for BalanceCard's cut-out corner. */
export function LinkAddPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-[48px] shrink-0 items-center gap-[7px] rounded-full bg-(--sp-pill) pr-[16px] pl-[8.5px] text-[13px] leading-none font-medium text-(--sp-pill-text) transition outline-none select-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97]"
    >
      <span className="flex size-[31px] items-center justify-center rounded-full bg-(--sp-pill-dot) text-(--sp-pill-dot-text)">
        <Plus className="size-[16px]" strokeWidth={1.75} aria-hidden />
      </span>
      {label}
    </Link>
  );
}

/**
 * Back card of the stack as a link (same as the kit's PeekCard, 80 tall,
 * 51 visible inside CardStack): logo left, label + trailing icon right.
 */
const PEEK_TONE = {
  sun: "bg-(--sp-card-back) text-(--sp-card-back-text)",
  ink: "bg-(--sp-card-ink) text-(--sp-card-ink-text)",
  soft: "bg-(--sp-panel) text-(--sp-text)",
} as const;

export function LinkPeekCard({
  href,
  label,
  trailing,
  tone = "sun",
}: {
  href: string;
  label: string;
  trailing?: ReactNode;
  /** Same tones as the kit's PeekCard. */
  tone?: keyof typeof PEEK_TONE;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative block h-[80px] w-full rounded-(--sp-radius) leading-none outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
        PEEK_TONE[tone]
      )}
    >
      <SpineLogo className="absolute top-[17px] left-[16px]" />
      <span className="absolute top-[20px] right-[18px] flex items-center gap-[5px] text-[13px] [&_svg]:size-[12px] [&_svg]:stroke-2">
        {label}
        {trailing}
      </span>
    </Link>
  );
}

/** Round soft icon (48) + label (12) 11 under it; the whole column is the tap area. */
export function LinkQuickAction({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col items-center rounded-2xl pt-[19.5px] pb-[20px] leading-none outline-none select-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) focus-visible:ring-inset"
    >
      <span className="flex size-[48px] items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) transition group-hover:bg-(--sp-soft-hover) group-active:scale-95 [&_svg]:size-[18px] [&_svg]:stroke-[1.9]">
        {icon}
      </span>
      <span className="mt-[11.2px] w-full truncate text-center text-[12px] text-(--sp-text-2)">{label}</span>
    </Link>
  );
}

/** The quick actions panel (339 × 112, radius 22), 4 equal columns. */
export function QuickActionsPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav
      aria-label="Quick actions"
      className={cn(
        "grid h-[112px] auto-cols-fr grid-flow-col rounded-(--sp-radius) bg-(--sp-panel) px-[2px]",
        className
      )}
    >
      {children}
    </nav>
  );
}
