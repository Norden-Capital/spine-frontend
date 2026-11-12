"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SwapStackProps = {
  /** Exactly two full cards (e.g. two BalanceCards). cards[0] starts in front. */
  cards: [ReactNode, ReactNode];
  /** Names for screen readers, e.g. ["Company", "Personal wallet"]. */
  labels: [string, string];
  /** Controlled: index of the front card. Leave out = the stack keeps its own state. */
  front?: 0 | 1;
  onFrontChange?: (front: 0 | 1) => void;
  /** Uncontrolled: which card starts in front (default 0). */
  defaultFront?: 0 | 1;
  /** Glass cards (BalanceCard glass): a soft colour blob behind, and no dimming
   *  filter on the back card (a filter would stop the glass seeing through). */
  glass?: boolean;
  className?: string;
};

const PEEK = 51; // visible part of the back card (reference: yellow card above the purple one)
const CARD = 180; // BalanceCard height
const DUR = 420; // ms

/**
 * Two cards stacked (reference style): the back card shows its top 51pt.
 * Tap that strip, or swipe the stack up / down, and the cards swap: the
 * back card slides down to the front while the front one moves up behind
 * it (same width, like the reference). 420ms, the kit ease; instant with reduced motion.
 * Keyboard: the strip is a button ("Show … in front").
 */
export function SwapStack({ cards, labels, front: frontProp, onFrontChange, defaultFront = 0, glass, className }: SwapStackProps) {
  const [own, setOwn] = useState<0 | 1>(defaultFront);
  const front = frontProp ?? own;
  const back = (front === 0 ? 1 : 0) as 0 | 1;
  const [moving, setMoving] = useState(false);
  const start = useRef<{ y: number; id: number } | null>(null);

  const swap = () => {
    const next = back;
    setMoving(true);
    if (frontProp === undefined) setOwn(next);
    onFrontChange?.(next);
    window.setTimeout(() => setMoving(false), DUR);
  };

  const pos = (i: 0 | 1) => {
    const isFront = i === front;
    return {
      zIndex: isFront ? 2 : 1,
      transform: isFront ? `translateY(${PEEK}px)` : "translateY(0)",
      transformOrigin: "50% 0%",
      filter: isFront || glass ? "none" : "brightness(0.96)",
    } as const;
  };

  return (
    <div
      className={cn("relative touch-pan-x select-none", className)}
      style={{ height: PEEK + CARD }}
      onPointerDown={(e) => {
        start.current = { y: e.clientY, id: e.pointerId };
      }}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s || s.id !== e.pointerId) return;
        if (Math.abs(e.clientY - s.y) > 36 && !moving) swap();
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      {glass ? <span aria-hidden className="sp-glass-blob pointer-events-none absolute inset-x-[8px] top-[8px] h-[150px]" /> : null}
      {([0, 1] as const).map((i) => (
        <div
          key={i}
          aria-hidden={i !== front}
          inert={i !== front}
          className={cn(
            "absolute inset-x-0 top-0 will-change-transform",
            "transition-[transform,filter] duration-[420ms] ease-(--sp-ease) motion-reduce:transition-none"
          )}
          style={pos(i)}
        >
          {cards[i]}
        </div>
      ))}
      {/* The back card's visible strip is the swap button. */}
      <button
        type="button"
        onClick={() => !moving && swap()}
        aria-label={`Show ${labels[back]} in front`}
        className="absolute inset-x-0 top-0 z-3 rounded-t-(--sp-radius) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
        style={{ height: PEEK - 4 }}
      />
      <span className="sr-only" aria-live="polite">
        {labels[front]} in front
      </span>
    </div>
  );
}
