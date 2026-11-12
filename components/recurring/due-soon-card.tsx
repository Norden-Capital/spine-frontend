import { DueBadge, RowIcon, SectionCard, SpRow } from "@/components/spine-ui";
import { TxLogo } from "@/components/expenses/tx-logo";
import type { DateSettings } from "@/lib/prefs";
import { dueState, shortDay } from "@/lib/repeat-schedule";
import { duePath, type Occurrence } from "@/lib/recurring-types";
import { formatMoney } from "@/lib/transactions-types";

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
          const income = o.type === "INCOME";
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
                  <span
                    className={
                      income
                        ? "text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums text-(--sp-income)"
                        : "text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums text-(--sp-text)"
                    }
                  >
                    {formatMoney(o.amount, income ? "+" : undefined)}
                  </span>
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
