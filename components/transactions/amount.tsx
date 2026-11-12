import { SpMoney } from "@/components/spine-ui";
import { signedMoney, txDirection, type TxType } from "@/lib/transactions-types";

/** "−$12.00" (expense, soft red) or "+$500.00" (income, soft green). */
export function Amount({
  type,
  amount,
  className,
}: {
  type: TxType;
  amount: string;
  className?: string;
}) {
  const dir = txDirection(type);
  return (
    <SpMoney direction={dir} className={["font-medium whitespace-nowrap", className].filter(Boolean).join(" ")}>
      {signedMoney(amount, dir)}
    </SpMoney>
  );
}
