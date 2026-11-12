import type { Metadata } from "next";
import { IconError, IconNoResults, IconSuccess } from "@/components/spine-ui";
import { DueBadge, EmptyState, InfoList, PageHeader, SpBadge, SpMoney } from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { formatDay, todayIn } from "@/lib/prefs";
import { dueState } from "@/lib/repeat-schedule";
import { getDateSettings } from "@/lib/prefs-server";
import { getOccurrence } from "@/lib/recurring-server";
import { duePath } from "@/lib/recurring-types";
import { signedMoney } from "@/lib/transactions-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { SkipOccurrence } from "@/components/recurring/skip-occurrence";
import { SpLinkButton } from "@/components/transactions/sp-link";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

export const metadata: Metadata = { title: "Reminder" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/**
 * One repeat-expense reminder (the alert opens it). DUE: everyone may add
 * the expense (the form opens prefilled); only the owner may skip it.
 * DONE / SKIPPED: a small state with a link.
 */
export default async function DueReminderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, dates, res] = await Promise.all([requireUser(duePath(id)), getDateSettings(), getOccurrence(id)]);
  const canSkip = isOwner(user);
  const back = { href: "/recurring", label: "Back to repeat expenses" };

  if (!res.ok) {
    const missing = res.status === 404;
    return (
      <div className="flex flex-col gap-[16px]">
        <PageHeader title="Reminder" back={back} />
        <EmptyState
          className={PLAIN_STATE_ICON}
          tone={missing ? "accent" : "danger"}
          icon={missing ? <IconNoResults /> : <IconError />}
          title={missing ? "Reminder not found" : "Could not load"}
          text={
            missing
              ? "This reminder no longer exists. Its repeat expense may be deleted."
              : "Please try again later."
          }
          action={
            <SpLinkButton href="/recurring" size="lg">
              Repeat expenses
            </SpLinkButton>
          }
        />
      </div>
    );
  }

  const o = res.data;
  const income = o.type === "INCOME";
  const day = formatDay(o.dueDate, dates);
  const due = dueState(o.dueDate, todayIn(dates.zone), { dateFormat: dates.dateFormat });
  const badge =
    o.status === "DONE" ? (
      <SpBadge tone="success">Done</SpBadge>
    ) : o.status === "SKIPPED" ? (
      <SpBadge>Skipped</SpBadge>
    ) : due ? (
      <DueBadge state={due.state} label={due.label} />
    ) : (
      <SpBadge tone="warning">Due</SpBadge>
    );

  return (
    <div className="flex flex-col gap-[16px]" data-testid="due-page" data-status={o.status}>
      <PageHeader title="Reminder" subtitle="Repeat expense" back={back} />

      <section className="flex flex-col items-center gap-[10px] rounded-(--sp-radius) bg-(--sp-panel) px-[16px] py-[22px] text-center">
        <span className="flex size-[48px] items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) [&_svg]:size-[20px] [&_svg]:stroke-[1.6]">
          <TxLogo logoUrls={o.logoUrls} icon={o.category.icon} />
        </span>
        <p className="max-w-full truncate text-[0.875rem] leading-normal font-medium text-(--sp-text)">
          {o.description || o.category.name}
        </p>
        <p className="text-[1.75rem] leading-snug font-semibold">
          <SpMoney direction={income ? "in" : "out"}>{signedMoney(o.amount, income ? "in" : "out")}</SpMoney>
        </p>
        {badge}
      </section>

      <InfoList
        rows={[
          { label: "Due date", value: day },
          { label: "Category", value: o.category.name },
          { label: "Type", value: income ? "Income" : "Expense" },
          ...(o.website ? [{ label: "Website", value: o.website }] : []),
        ]}
      />

      {o.status === "DUE" ? (
        <div className="flex flex-col gap-[8px]">
          <SpLinkButton
            href={`/transactions/new?occurrence=${encodeURIComponent(o.id)}`}
            size="lg"
            className="w-full"
            data-testid="due-add-expense"
          >
            {income ? "Add the income" : "Add the expense"}
          </SpLinkButton>
          {canSkip && <SkipOccurrence id={o.id} dueDate={o.dueDate} size="lg" className="w-full" />}
          <p className="px-[4px] text-center text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            The form opens filled in. You add the proof there.
          </p>
        </div>
      ) : (
        <EmptyState
          framed
          icon={o.status === "DONE" ? <IconSuccess /> : <IconNoResults />}
          title={o.status === "DONE" ? "Already done" : "Skipped"}
          text={o.status === "DONE" ? "It is saved as an expense." : "Nothing was added for this date."}
          action={
            o.status === "DONE" && o.transactionId ? (
              <SpLinkButton href={`/transactions/${encodeURIComponent(o.transactionId)}`} data-testid="due-open-transaction">
                Open the expense
              </SpLinkButton>
            ) : (
              <SpLinkButton href="/recurring" variant="secondary">
                Repeat expenses
              </SpLinkButton>
            )
          }
        />
      )}
    </div>
  );
}
