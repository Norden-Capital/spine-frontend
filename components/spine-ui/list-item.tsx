import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ListItemProps = {
  /** Lucide icon (shown in a 33pt soft circle). */
  icon: ReactNode;
  title: string;
  /** Small gray line, e.g. "12:40 pm • 12 November, 2026". */
  meta?: string;
  /** Already formatted WITH the sign, e.g. "−$400.00" or "+$1,200.00". */
  amount: string;
  /** Money direction: "expense" = soft red (out), "income" = soft green (in), "neutral" = normal text. */
  tone?: "expense" | "income" | "neutral";
  /** Makes the whole row a link. */
  href?: string;
  className?: string;
};

/**
 * One row, 48pt tall (reference): 33pt round icon at 14pt from the left,
 * title 12/500, date line 10/400 gray, amount 13/600 on the right.
 */
export function ListItem({ icon, title, meta, amount, tone = "expense", href, className }: ListItemProps) {
  const body = (
    <>
      <span className="mt-[7.5px] flex size-[33px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) [&_svg]:size-[15px] [&_svg]:stroke-[1.6]">
        {icon}
      </span>
      <span className="mt-[10.5px] ml-[10.8px] min-w-0 flex-1">
        <span className="-my-[0.25em] block truncate text-[12px] font-medium text-(--sp-text)">{title}</span>
        {meta ? <span className="mt-[calc(3.9px-0.25em)] -mb-[0.25em] block truncate text-[10px] text-(--sp-text-faint)">{meta}</span> : null}
      </span>
      <span
        className={cn(
          "mt-[calc(13.4px-0.25em)] -mb-[0.25em] ml-3 shrink-0 text-[13px] font-semibold whitespace-nowrap tabular-nums",
          tone === "income" ? "text-(--sp-money-in)" : tone === "expense" ? "text-(--sp-money-out)" : "text-(--sp-text)"
        )}
      >
        {amount}
      </span>
    </>
  );

  const base = "flex h-[48px] items-start pr-[9px] pl-[14px] leading-[1.5]";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "rounded-2xl transition outline-none hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
          className
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={cn(base, className)}>{body}</div>;
}
