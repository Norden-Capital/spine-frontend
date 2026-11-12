import type { ReactNode } from "react";
import Link from "next/link";
import { IconAdd } from "@/components/spine-ui";
import { GlassRims, SpineLogo } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

// Link versions of the kit's AddPill / QuickAction / IconButton (the kit
// ships buttons; these go to a page). Same sizes and tokens as components/spine-ui.
// The class strings are shared with the button versions in ./space-actions.tsx.

export const ADD_PILL_CLASS =
  "inline-flex h-[48px] shrink-0 items-center gap-[7px] rounded-full bg-(--sp-pill) pr-[16px] pl-[8.5px] text-[13px] leading-snug font-medium text-(--sp-pill-text) transition outline-none select-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] motion-reduce:transition-none";
export const ADD_PILL_DOT_CLASS =
  "flex size-[31px] items-center justify-center rounded-full bg-(--sp-pill-dot) text-(--sp-pill-dot-text) [&_svg]:size-[16px]";

/** Glass version (on glass cards), same as the kit's `AddPill glass`. */
export const GLASS_PILL_CLASS =
  "relative inline-flex h-[48px] shrink-0 items-center gap-[7px] rounded-full sp-glass-pill pr-[16px] pl-[8.5px] text-[13px] leading-[1.5] font-medium text-(--sp-glass-pill-text) transition outline-none select-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";
export const GLASS_PILL_DOT_CLASS =
  "relative flex size-[31px] items-center justify-center rounded-full bg-(--sp-glass-pill-dot) text-(--sp-glass-pill-dot-text) [&_svg]:size-[16px]";

/** Black "+ label" pill (116 × 48), for BalanceCard's cut-out corner. `icon` replaces the "+". */
export function LinkAddPill({
  href,
  label,
  icon,
  testId,
  glass,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  testId?: string;
  /** Glass button for glass cards (the kit's AddPill glass, as a link). */
  glass?: boolean;
}) {
  return (
    <Link href={href} className={glass ? GLASS_PILL_CLASS : ADD_PILL_CLASS} data-testid={testId}>
      {glass ? <GlassRims radius="9999px" /> : null}
      <span className={glass ? GLASS_PILL_DOT_CLASS : ADD_PILL_DOT_CLASS}>{icon ?? <IconAdd aria-hidden />}</span>
      <span className="relative">{label}</span>
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
        "relative block h-[80px] w-full rounded-(--sp-radius) leading-snug outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
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

export const QUICK_ACTION_CLASS =
  "group flex min-w-0 flex-col items-center rounded-2xl pt-[17.7px] pb-[18.2px] leading-snug outline-none select-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) focus-visible:ring-inset";
export const QUICK_ACTION_ICON_CLASS =
  "flex size-[48px] items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) transition group-hover:bg-(--sp-soft-hover) group-active:scale-95 motion-reduce:transition-none [&_svg]:size-[18px] [&_svg]:stroke-[1.9]";
// rem: follows the text-size setting. Line height 1.3 + no fixed panel height,
// so letters like g, y, p are never cut off (any font, any size).
export const QUICK_ACTION_LABEL_CLASS =
  "mt-[11.2px] w-full truncate px-[2px] text-center text-[0.75rem] leading-[1.5] text-(--sp-text-2)";

/** Round soft icon (48) + label (12) 11 under it; the whole column is the tap area. */
export function LinkQuickAction({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link href={href} className={QUICK_ACTION_CLASS}>
      <span className={QUICK_ACTION_ICON_CLASS}>{icon}</span>
      <span className={QUICK_ACTION_LABEL_CLASS}>{label}</span>
    </Link>
  );
}

/** The quick actions panel (339 × 112 at normal text size, grows with bigger text; radius 22), equal columns. */
export function QuickActionsPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav
      aria-label="Quick actions"
      className={cn(
        "grid min-h-[112px] auto-cols-fr grid-flow-col rounded-(--sp-radius) bg-(--sp-panel) px-[2px]",
        className
      )}
    >
      {children}
    </nav>
  );
}

export const ICON_BUTTON_CLASS =
  "relative inline-flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) transition outline-none select-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:stroke-[1.6]";

/** Round 44 icon link (kit IconButton look, "surface"), e.g. Search in the page header. */
export function LinkIconButton({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link href={href} aria-label={label} className={ICON_BUTTON_CLASS}>
      {icon}
    </Link>
  );
}
