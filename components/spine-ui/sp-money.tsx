import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MoneyDirection = "in" | "out" | "net";

export type SpMoneyProps = {
  /** "in" = soft green, "out" = soft red, "net" = normal text colour. */
  direction: MoneyDirection;
  /** "page" (default) = coloured text on the page / panels / sheets.
   *  "card" = a soft pill, for amounts on the purple / yellow / ink cards. */
  on?: "page" | "card";
  /** Already formatted WITH the sign, e.g. "−$120.00" or "+$500.00". */
  children: ReactNode;
  className?: string;
};

/**
 * A money amount that shows its direction: the sign (in the text) plus a
 * calm colour. AA on every surface, light + dark. On cards it is a soft
 * inline pill (no layout shift: no vertical padding).
 */
export function SpMoney({ direction, on = "page", children, className }: SpMoneyProps) {
  if (on === "card") {
    return (
      <span
        className={cn(
          "rounded-full px-[0.45em] tabular-nums [box-decoration-break:clone]",
          direction === "in" && "bg-(--sp-money-in-chip) text-(--sp-money-in-chip-text)",
          direction === "out" && "bg-(--sp-money-out-chip) text-(--sp-money-out-chip-text)",
          className
        )}
      >
        {children}
      </span>
    );
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
