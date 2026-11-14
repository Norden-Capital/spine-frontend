import { SectionCard } from "@/components/spine-ui";
import type { DateSettings } from "@/lib/prefs";
import type { BalanceList } from "@/lib/balances-types";
import { formatMoney } from "@/lib/transactions-types";
import { BalanceRow } from "./balance-parts";

/** Company home: the monthly total, how many need a recharge, the 2 most urgent rows. */
export function BalancesCard({
  list,
  dates,
  today,
}: {
  list: BalanceList;
  dates: Pick<DateSettings, "dateFormat">;
  today: string;
}) {
  if (list.items.length === 0) return null;
  const need = list.summary.needRecharge;
  return (
    <SectionCard title="Balances" action={{ label: "See all", href: "/balances" }}>
      <div className="px-[4px] pb-[6px]" data-testid="balances-card">
        <p className="px-[10px] pb-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
          <span className="font-semibold text-(--sp-text)">{formatMoney(list.summary.perMonth)}</span> a month
          {need > 0 ? ` · ${need} need${need === 1 ? "s" : ""} a recharge` : " · all fine"}
        </p>
        {list.items.slice(0, 2).map((b) => (
          <BalanceRow key={b.id} b={b} today={today} dateFormat={dates.dateFormat} />
        ))}
      </div>
    </SectionCard>
  );
}
