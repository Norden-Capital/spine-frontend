import { DueBadge, RowIcon, SectionCard, SpMoney, SpRow } from "@/components/spine-ui";
import { TxLogo } from "@/components/expenses/tx-logo";
import type { DateSettings } from "@/lib/prefs";
import { dueState, shortDay } from "@/lib/repeat-schedule";
import { duePath, type Occurrence } from "@/lib/recurring-types";
import { signedMoney, txDirection } from "@/lib/transactions-types";

/** Home, the owner: up to 3 repeat-expense reminders waiting, + "See all". */
export function DueSoonCard({
  items,
  dates,
  today,
  className,
}: {
  items: Occurrence[];
  dates: Pick<DateSettings, "dateFormat">;
  /** My today, "YYYY-MM-DD" (todayIn(zone)). */
  today: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <SectionCard className={className} title="Due soon" action={{ label: "See all", href: "/recurring" }}>
      <div className="px-[4px]" data-testid="due-card">
        {items.slice(0, 3).map((o) => {
          const dir = txDirection(o.type);
          const due = dueState(o.dueDate, today, { dateFormat: dates.dateFormat });
          return (
            <SpRow
              key={o.id}
              href={duePath(o.id)}
              leading={
                <RowIcon>
                  <TxLogo logoUrl={o.logoUrl} icon={o.category.icon} />
                </RowIcon>
              }
              title={o.description || o.category.name}
              subtitle={`Due ${shortDay(o.dueDate, { dateFormat: dates.dateFormat, today, weekday: true })}`}
              trailing={
                <span className="flex shrink-0 flex-col items-end gap-[4px]" data-testid="due-card-row">
                  <SpMoney direction={dir} className="text-[0.8125rem] font-semibold whitespace-nowrap">
                    {signedMoney(o.amount, dir)}
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
