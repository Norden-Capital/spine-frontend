import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TopBarProps = {
  /** Left side, e.g. the menu or back IconButton. */
  left?: ReactNode;
  /** Right side, e.g. bell IconButton + Avatar (6px apart, like the reference). */
  right?: ReactNode;
  className?: string;
};

/** Top row of a screen: 44px tall, one round button left, actions right. */
export function TopBar({ left, right, className }: TopBarProps) {
  return (
    <header className={cn("flex h-[44px] items-center justify-between", className)}>
      <div className="flex items-center gap-[6px]">{left}</div>
      <div className="flex items-center gap-[6px]">{right}</div>
    </header>
  );
}
