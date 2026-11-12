import type { Metadata } from "next";
import { IconError } from "@/components/spine-ui";
import { EmptyState, PageHeader } from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getCompanyRecurring, getRecurringDue } from "@/lib/recurring-server";
import { CompanyRecurringManager } from "@/components/recurring/recurring-manager";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

export const metadata: Metadata = { title: "Repeat expenses" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** Company repeat expenses: reminders only. The owner manages, members read. */
export default async function RecurringPage() {
  const user = await requireUser("/recurring");
  const canManage = isOwner(user);
  const [items, due, categories, dates] = await Promise.all([
    getCompanyRecurring(),
    getRecurringDue(),
    canManage ? getActiveCategories() : Promise.resolve(null),
    getDateSettings(),
  ]);
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        title="Repeat expenses"
        subtitle={canManage ? "A reminder on each date. Nothing is added by itself." : "Company reminders (read only)"}
      />
      {items.ok ? (
        <CompanyRecurringManager
          items={items.data}
          due={due.ok ? due.data : []}
          categories={categories ?? []}
          today={todayIn(dates.zone)}
          canManage={canManage}
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
