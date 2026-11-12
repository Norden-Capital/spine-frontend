import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type DockItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Optional icon for the active state (the reference uses a filled house). */
  activeIcon?: ReactNode;
  active?: boolean;
};

export type FloatingDockProps = {
  items: DockItem[];
  /**
   * "fixed" (default): floats at the bottom of the screen, 9pt above the
   * iPhone home bar. "static": in the page flow (previews).
   */
  position?: "fixed" | "static";
  className?: string;
};

/**
 * Floating navigation dock, measured from the reference (pt):
 * black pill 54 tall (~250 wide with 4 items), active item = white pill
 * 93 × 38 with icon + label (13/500), others = 38 round buttons.
 * Every item has a 44pt tap area around what you see.
 * Pages under a fixed dock need bottom space: add DOCK_SPACE_CLASS.
 */
export function FloatingDock({ items, position = "fixed", className }: FloatingDockProps) {
  const nav = (
    <nav
      aria-label="Main"
      className={cn(
        "pointer-events-auto flex h-(--sp-dock-h) items-center gap-[3px] rounded-full bg-(--sp-dock) p-[5px] shadow-(--sp-dock-shadow)",
        position === "static" && className
      )}
    >
      {items.map((item) =>
        item.active ? (
          <Link
            key={item.href}
            href={item.href}
            aria-current="page"
            className="group flex h-[44px] items-center px-[3px] outline-none"
          >
            <span className="flex h-[38px] min-w-[93px] items-center gap-[10px] rounded-full bg-(--sp-dock-active) pr-[17px] pl-[12px] text-[13px] leading-none font-medium text-(--sp-dock-active-text) group-focus-visible:ring-3 group-focus-visible:ring-(--sp-ring) [&_svg]:size-[15px] [&_svg]:stroke-2">
              {item.activeIcon ?? item.icon}
              {item.label}
            </span>
          </Link>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className="group flex size-[44px] items-center justify-center outline-none"
          >
            <span className="flex size-[38px] items-center justify-center rounded-full bg-(--sp-dock-item) text-(--sp-dock-item-text) transition group-hover:brightness-125 group-focus-visible:ring-3 group-focus-visible:ring-(--sp-ring) group-active:scale-95 [&_svg]:size-[17px] [&_svg]:stroke-[1.6]">
              {item.icon}
            </span>
          </Link>
        )
      )}
    </nav>
  );

  if (position === "static") return nav;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4",
        "pb-[calc(env(safe-area-inset-bottom)+var(--sp-dock-gap))]",
        className
      )}
    >
      {nav}
    </div>
  );
}

/**
 * Bottom padding for a page under the fixed dock, so the last item is never
 * hidden. (The body already pads the safe area, see app/globals.css.)
 */
export const DOCK_SPACE_CLASS = "pb-[calc(var(--sp-dock-h)+var(--sp-dock-gap)+16px)]";
