import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IconClose } from "@/components/spine-ui";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getTransaction } from "@/lib/transactions-server";
import { getOccurrence } from "@/lib/recurring-server";
import { duePath, type Occurrence } from "@/lib/recurring-types";
import { NoticeBox } from "@/components/admin/notice";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { SpIconLink } from "@/components/transactions/sp-link";
import { PageHeader } from "@/components/spine-ui";

export const metadata: Metadata = { title: "New transaction" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/**
 * ?copy={id}: start from that transaction (no proof, date today).
 * ?occurrence={id}: save a repeat-expense reminder (owner and members): the form
 * starts filled from it and the POST marks the reminder done.
 */
export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const { copy, occurrence } = await searchParams;
  const occurrenceId = typeof occurrence === "string" && occurrence ? occurrence : null;
  const [categories, dates, source, reminder] = await Promise.all([
    getActiveCategories(),
    getDateSettings(),
    typeof copy === "string" && !occurrenceId ? getTransaction(copy) : Promise.resolve(null),
    occurrenceId ? loadReminder(occurrenceId) : Promise.resolve(null),
  ]);
  const today = todayIn(dates.zone);
  const due = reminder?.ok ? reminder.data : null;
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        title={due ? "Add from reminder" : source?.ok ? "Copy transaction" : "New transaction"}
        subtitle={due ? "Company · repeat expense" : "Company"}
        action={
          <SpIconLink
            href={due ? duePath(due.id) : "/transactions"}
            label="Cancel and go back"
            icon={<IconClose aria-hidden />}
          />
        }
      />
      {reminder && !reminder.ok && (
        <NoticeBox
          notice={{
            kind: "error",
            text:
              reminder.status === 404
                ? "This reminder no longer exists. You can still add a normal expense."
                : "The reminder could not be loaded. You can still add a normal expense.",
          }}
        />
      )}
      <TransactionForm
        transaction={null}
        copyFrom={due ? draftFrom(due) : source?.ok ? source.data : null}
        occurrence={due ? { id: due.id, date: due.dueDate <= today ? due.dueDate : today } : null}
        categories={categories ?? []}
        today={today}
      />
    </div>
  );
}

/**
 * The reminder, only when it can be saved here (owner and members may): reminders
 * already done or skipped go to the reminder page (it shows the state).
 */
async function loadReminder(id: string) {
  const res = await getOccurrence(id);
  if (res.ok && res.data.status !== "DUE") redirect(duePath(id));
  return res;
}

/** Form start values from a reminder. */
function draftFrom(o: Occurrence) {
  return {
    type: o.type,
    amount: o.amount,
    date: o.dueDate,
    description: o.description,
    website: o.website,
    category: {
      id: o.category.id,
      name: o.category.name,
      icon: o.category.icon,
      archived: o.category.archived,
      kind: o.category.kind,
    },
    files: [],
  };
}
