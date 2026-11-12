import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SpineLogo } from "./spine-logo";

const LOGO_TILE =
  "flex size-[44px] items-center justify-center rounded-[12px] bg-(--sp-panel) text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)";

/** The Spine logo in a 44 tile, top-left of every screen (no menu button). With `href`, a link (e.g. home). */
export function TopBarLogo({ href, className }: { href?: string; className?: string }) {
  const logo = (
    <span aria-hidden className="flex">
      <SpineLogo className="size-[20px]" />
    </span>
  );
  return href ? (
    <Link href={href} aria-label="Spine, home" className={cn(LOGO_TILE, "transition active:scale-95 motion-reduce:transition-none", className)}>
      {logo}
    </Link>
  ) : (
    <span role="img" aria-label="Spine" className={cn(LOGO_TILE, className)}>
      {logo}
    </span>
  );
}

export type TopBarProps = {
  /** Left side. Default: the Spine logo tile. Pass e.g. a back IconButton, or null for nothing. */
  left?: ReactNode;
  /** Right side, e.g. bell IconButton + Avatar (6px apart, like the reference). */
  right?: ReactNode;
  className?: string;
};

/** Top row of a screen: 44px tall, the Spine logo left (default), actions right. */
export function TopBar({ left, right, className }: TopBarProps) {
  return (
    <header className={cn("flex h-[44px] items-center justify-between", className)}>
      <div className="flex items-center gap-[6px]">{left === undefined ? <TopBarLogo /> : left}</div>
      <div className="flex items-center gap-[6px]">{right}</div>
    </header>
  );
}
