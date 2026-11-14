import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MoneyDirection = "in" | "out" | "net";

export type SpMoneyProps = {
  /** "in" = soft green, "out" = soft red, "net" = normal text colour. */
  direction: MoneyDirection;
  /** "page" (default) = coloured text on the page / panels / sheets.
   *  "card" = plain card text (no pill, no colour) on the purple / yellow / ink cards. */
  on?: "page" | "card";
  /** Already formatted WITH the sign, e.g. "−$120.00" or "+$500.00". */
  children: ReactNode;
  className?: string;
};

/**
 * A money amount that shows its direction: the sign (in the text) plus a
 * calm colour. AA on every surface, light + dark. On cards: plain card
 * text, the sign only (user rule: no pills or other colours inside a card).
 */
export function SpMoney({ direction, on = "page", children, className }: SpMoneyProps) {
  if (on === "card") {
    return <span className={cn("tabular-nums", className)}>{children}</span>;
  }
  return (
    <span
      className={cn(
        "tabular-nums",
        direction === "in" && "text-(--sp-money-in)",
        direction === "out" && "text-(--sp-money-out)",
        className
      )}
    >
      {children}
    </span>
  );
}
