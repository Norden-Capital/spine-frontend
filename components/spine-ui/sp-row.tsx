import type { ReactNode } from "react";
import Link from "next/link";
import { IconChevronRight } from "./icons";
import { cn } from "@/lib/utils";

export type SpRowProps = {
  /** Left: RowIcon, an avatar… */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right: a value, a badge, an IconButton… With href and no trailing, a chevron shows. */
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  /** Sub-item (e.g. a subcategory): moved 24 to the right. */
  indent?: boolean;
  /** Gray title (archived, disabled). */
  muted?: boolean;
  className?: string;
};

/** Round soft icon for SpRow (33, like the list rows). */
export function RowIcon({ children, tone }: { children: ReactNode; tone?: "soft" | "ink" }) {
  return (
    <span
      className={cn(
        "flex size-[33px] shrink-0 items-center justify-center rounded-full [&_svg]:size-[15px] [&_svg]:stroke-[1.7]",
        tone === "ink" ? "bg-(--sp-chip-active) text-(--sp-chip-active-text)" : "bg-(--sp-soft) text-(--sp-text)"
      )}
    >
      {children}
    </span>
  );
}

/**
 * General row for settings and admin lists (users, categories, devices,
 * trash): 56 min, leading 33, title 13 / Medium, subtitle 11 gray, any
 * trailing. Same left grid as ListItem (14 padding). Text in rem.
 */
export function SpRow({ leading, title, subtitle, trailing, href, onClick, indent, muted, className }: SpRowProps) {
  const body = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[0.8125rem] leading-tight font-medium",
            muted ? "text-(--sp-text-muted)" : "text-(--sp-text)"
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="mt-[3px] block truncate text-[0.6875rem] leading-tight text-(--sp-text-muted)">{subtitle}</span>
        ) : null}
      </span>
      {trailing ??
        (href ? (
          <IconChevronRight className="size-[22px] text-(--sp-text-faint)" />
        ) : null)}
    </>
  );
  const cls = cn(
    "flex min-h-[56px] w-full items-center gap-[10.8px] rounded-2xl py-[8px] pr-[8px] text-left",
    indent ? "pl-[38px]" : "pl-[14px]",
    (href || onClick) &&
      "transition outline-none hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
    className
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  return <div className={cls}>{body}</div>;
}

/** Panel that holds SpRows (radius 22), with an optional title like SectionCard. */
export function RowGroup({
  title,
  aside,
  children,
  className,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-(--sp-radius) bg-(--sp-panel) p-[4px]", className)}>
      {title ? (
        <div className="flex min-h-[44px] items-end justify-between gap-3 px-[10px] pb-[6px]">
          <h2 className="text-[0.8125rem] leading-none font-medium text-(--sp-text)">{title}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}
