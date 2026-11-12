import { formatMoney, type TxType } from "@/lib/transactions-types";
import { cn } from "@/lib/utils";

/** "−$12.00" (expense, red-ish) or "+$500.00" (income, green-ish). Calm colors. */
export function Amount({
  type,
  amount,
  className,
}: {
  type: TxType;
  amount: string;
  className?: string;
}) {
  const income = type === "INCOME";
  return (
    <span
      className={cn(
        "font-medium whitespace-nowrap tabular-nums",
        income ? "text-emerald-700 dark:text-emerald-400" : "text-red-700/90 dark:text-red-400/90",
        className
      )}
    >
      {formatMoney(amount, income ? "+" : "-")}
    </span>
  );
}
