import type { Metadata } from "next";
import { IconError } from "@/components/spine-ui";
import { EmptyState, PageHeader } from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getCompanyRecurring, getRecurringDue } from "@/lib/recurring-server";
import { CompanyRecurringManager } from "@/components/recurring/recurring-manager";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

export const metadata: Metadata = { title: "Repeat expenses" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/**
 * Company repeat expenses: reminders only. Everyone adds; the person who
 * added one (or the owner) changes it.
 */
export default async function RecurringPage() {
  await requireUser("/recurring");
  const [items, due, categories, dates] = await Promise.all([
    getCompanyRecurring(),
    getRecurringDue(),
    getActiveCategories(),
    getDateSettings(),
  ]);
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader title="Repeat expenses" subtitle="A reminder on each date. Nothing is added by itself." />
      {items.ok ? (
        <CompanyRecurringManager
          items={items.data}
          due={due.ok ? due.data : []}
          categories={categories ?? []}
          today={todayIn(dates.zone)}
        />
      ) : (
        <EmptyState
          className={PLAIN_STATE_ICON}
          tone="danger"
          icon={<IconError />}
          title="Could not load"
          text="Repeat expenses could not be loaded. Please try again later."
        />
      )}
    </div>
  );
}
