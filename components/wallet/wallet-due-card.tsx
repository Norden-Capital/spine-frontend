import { DueBadge, RowIcon, SectionCard, SpMoney, SpRow } from "@/components/spine-ui";
import { CategoryIcon } from "@/components/expenses/category-icon";
import type { DateFormat } from "@/lib/prefs";
import { daysBetween, dueState, repeatLabel, shortDay } from "@/lib/repeat-schedule";
import { txDirection } from "@/lib/transactions-types";
import { walletSigned, type Recurring } from "@/lib/wallet-types";

/** Running items (not paused) whose next date is in the next 7 days, or already passed. Soonest first. */
export function walletDueSoon(items: Recurring[], today: string): Recurring[] {
  return items
    .filter(
      (r) =>
        r.active &&
        !(r.pausedUntil && r.pausedUntil > today) &&
        r.nextDate !== null &&
        daysBetween(today, r.nextDate) <= 7
    )
    .sort((a, b) => a.nextDate!.localeCompare(b.nextDate!));
}

/** Wallet dashboard: up to 3 recurring items due within 7 days, + "See all". Hidden when none. */
export function WalletDueCard({
  items,
  today,
  dateFormat,
  className,
}: {
  items: Recurring[];
  today: string;
  dateFormat: DateFormat;
  className?: string;
}) {
  const soon = walletDueSoon(items, today);
  if (soon.length === 0) return null;
  return (
    <SectionCard className={className} title="Due soon" action={{ label: "See all", href: "/wallet/recurring" }}>
      <div className="px-[4px]" data-testid="wallet-due-card">
        {soon.slice(0, 3).map((r) => {
          const dir = txDirection(r.type);
          const due = dueState(r.nextDate, today, { dateFormat });
          return (
            <SpRow
              key={r.id}
              href="/wallet/recurring"
              leading={
                <RowIcon>
                  <CategoryIcon name={r.category.icon} />
                </RowIcon>
              }
              title={r.name}
              subtitle={`${repeatLabel(r.unit, r.every)} · ${shortDay(r.nextDate!, { dateFormat, today, weekday: true })}`}
              trailing={
                <span className="flex shrink-0 flex-col items-end gap-[4px]" data-testid="wallet-due-card-row">
                  <SpMoney direction={dir} className="text-[0.8125rem] font-semibold whitespace-nowrap">
                    {walletSigned(r.amount, dir, r.currency)}
                  </SpMoney>
                  {due && <DueBadge state={due.state} label={due.label} />}
                </span>
              }
            />
          );
        })}
      </div>
    </SectionCard>
  );
}
