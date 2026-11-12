"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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
   * href of the item the user just tapped, while its page loads. The pill
   * moves there at once. Optional: the dock already does this by itself on
   * tap, and clears it when `active` changes.
   */
  pendingHref?: string | null;
  /**
   * "fixed" (default): floats at the bottom of the screen, 9pt above the
   * iPhone home bar. "static": in the page flow (previews).
   */
  position?: "fixed" | "static";
  className?: string;
};

// Measured sizes (pt), see design/BRIEF.md section 9.
const PAD = 5; // dock padding
const GAP = 3; // between items
const ITEM_PX = 3; // tap area around the visible 38 shape
const ROUND = 38; // inactive circle
const ACTIVE_FIXED = 12 + 18 + 10 + 17; // pl + icon + gap + pr (label width is measured)

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Floating navigation dock, measured from the reference (pt): black pill 54
 * tall, active item = white pill 38 tall with icon + label (13 / Medium),
 * the others = 38 round buttons; 44 tap areas.
 *
 * Motion: ONE white pill slides to the new item (250ms) while the label
 * opens and the old one closes; the tapped item reacts at once (scale 0.95)
 * and the pill moves before the next page is ready. No jump: before the
 * first measure, the active item draws its own white shape (also the
 * server HTML). All motion is off with prefers-reduced-motion.
 * Pages under a fixed dock need bottom space: add DOCK_SPACE_CLASS.
 */
export function FloatingDock({ items, pendingHref, position = "fixed", className }: FloatingDockProps) {
  const activeHref = items.find((i) => i.active)?.href ?? null;
  const [tapped, setTapped] = useState<string | null>(null);
  const [lastActive, setLastActive] = useState(activeHref);
  // A new page is active: forget the tap (state reset during render, no effect).
  if (lastActive !== activeHref) {
    setLastActive(activeHref);
    setTapped(null);
  }
  const shown = pendingHref ?? tapped ?? activeHref;

  // Safety: if the navigation never happens, drop the tap after 4s.
  useEffect(() => {
    if (!tapped) return;
    const t = setTimeout(() => setTapped(null), 4000);
    return () => clearTimeout(t);
  }, [tapped]);

  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const [labelW, setLabelW] = useState<number[] | null>(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    setLabelW(labels.current.map((el) => (el ? el.scrollWidth : 0)));
  }, []);

  useIsoLayoutEffect(() => {
    measure();
    // Turn transitions on only after the first placement (no slide on load).
    const timer = setTimeout(() => setAnimate(true), 60);
    const ro = new ResizeObserver(measure);
    labels.current.forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [measure, items.length]);

  // Where the pill goes: computed from the final layout (not the animating one).
  let pill: { x: number; w: number } | null = null;
  if (labelW && shown) {
    let x = PAD;
    for (let i = 0; i < items.length; i++) {
      const on = items[i].href === shown;
      const w = on ? ACTIVE_FIXED + (labelW[i] ?? 0) : ROUND;
      if (on) {
        pill = { x: x + ITEM_PX, w };
        break;
      }
      x += w + ITEM_PX * 2 + GAP;
    }
  }
  const ready = pill !== null;

  const nav = (
    <nav
      aria-label="Main"
      className={cn(
        "pointer-events-auto relative flex h-(--sp-dock-h) items-center gap-[3px] rounded-full bg-(--sp-dock) p-[5px] shadow-(--sp-dock-shadow)",
        position === "static" && className
      )}
    >
      {/* The one white pill that slides. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-[8px] left-0 z-[1] h-[38px] rounded-full bg-(--sp-dock-active)",
          animate && "transition-[transform,width] duration-(--sp-dur) ease-(--sp-ease) motion-reduce:transition-none",
          !ready && "opacity-0"
        )}
        style={pill ? { width: pill.w, transform: `translateX(${pill.x}px)` } : undefined}
      />
      {items.map((item, i) => {
        const on = item.href === shown;
        const current = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            aria-label={on ? undefined : item.label}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              if (item.href !== activeHref) setTapped(item.href);
            }}
            className="group relative flex h-[44px] shrink-0 items-center px-[3px] outline-none"
          >
            <span
              className={cn(
                "relative flex h-[38px] items-center rounded-full leading-[1.5]",
                "transition-[padding,transform,background-color,color] duration-(--sp-dur) ease-(--sp-ease) motion-reduce:transition-none",
                "group-active:scale-95 motion-reduce:group-active:scale-100",
                "group-focus-visible:ring-3 group-focus-visible:ring-(--sp-ring)",
                "[&_svg]:size-[18px] [&_svg]:shrink-0",
                on
                  ? cn(
                      "pr-[17px] pl-[12px] text-(--sp-dock-active-text) [&_svg]:stroke-2",
                      // Before the pill is placed, this item draws the white shape itself.
                      ready ? "bg-transparent" : "bg-(--sp-dock-active)"
                    )
                  : "bg-(--sp-dock-item) px-[10px] text-(--sp-dock-item-text) group-hover:brightness-125 [&_svg]:stroke-[1.6]"
              )}
            >
              <span className={cn("relative z-[2] flex items-center transition-colors duration-(--sp-dur)", on && "text-(--sp-card-front)")}>
                {on ? (item.activeIcon ?? item.icon) : item.icon}
              </span>
              <span
                ref={(el) => {
                  labels.current[i] = el;
                }}
                className={cn(
                  "relative z-[2] overflow-hidden text-[13px] font-medium whitespace-nowrap",
                  "transition-[max-width,margin,opacity] duration-(--sp-dur) ease-(--sp-ease) motion-reduce:transition-none",
                  on ? "ml-[10px] max-w-[120px] opacity-100" : "ml-0 max-w-0 opacity-0"
                )}
              >
                {item.label}
              </span>
            </span>
          </Link>
        );
      })}
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
