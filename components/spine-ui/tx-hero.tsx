import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TxHeroProps = {
  /** "company" = purple card, "wallet" = yellow card (like the home stack). */
  tone?: "company" | "wallet";
  /** Category icon. */
  icon: ReactNode;
  /** Top-right label, e.g. "Company" or "Wallet". */
  tag?: string;
  /** Description, or the category name. */
  title: string;
  /** e.g. "Bills · Thu 12 Nov 2026". */
  meta?: string;
  /** Already formatted with sign, e.g. "-$120.00". */
  amount: string;
  /** e.g. "Expense" / "Income". */
  kind?: string;
  className?: string;
};

/**
 * Top of a transaction page: the transaction as a card, in the same
 * style as the home cards (radius 22, amount 34 / Medium, no shadow).
 */
export function TxHero({ tone = "company", icon, tag, title, meta, amount, kind, className }: TxHeroProps) {
  const wallet = tone === "wallet";
  return (
    <section
      className={cn(
        "rounded-(--sp-radius) px-[17px] pt-[16px] pb-[20px]",
        wallet
          ? "bg-(--sp-card-back) text-(--sp-card-back-text)"
          : "bg-(--sp-card-front) text-(--sp-card-front-text)",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-[44px] items-center justify-center rounded-full bg-current/12 [&_svg]:size-[20px] [&_svg]:stroke-[1.8]">
          {icon}
        </span>
        {tag ? <span className="text-[0.8125rem] leading-none">{tag}</span> : null}
      </div>
      <p className="mt-[18px] text-[0.9375rem] leading-snug font-medium break-words">{title}</p>
      {meta ? <p className="mt-[4px] text-[0.75rem] leading-snug opacity-75">{meta}</p> : null}
      <div className="mt-[14px] flex items-end justify-between gap-3 leading-none">
        <p className="text-[34px] font-medium tracking-tight tabular-nums">{amount}</p>
        {kind ? <span className="pb-[4px] text-[0.75rem] opacity-75">{kind}</span> : null}
      </div>
    </section>
  );
}
