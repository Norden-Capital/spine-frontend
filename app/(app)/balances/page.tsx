import type { Metadata } from "next";
import { BalanceCard, EmptyState, IconError, PageHeader } from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getBalances } from "@/lib/balances-server";
import { byUrgency, inWords } from "@/lib/balances-types";
import { daysBetween } from "@/lib/repeat-schedule";
import { formatMoney } from "@/lib/transactions-types";
import { BalanceRow, BalancesIcon } from "@/components/balances/balance-parts";
import { HeaderAddLink } from "@/components/nav/header-add-link";
import { PageEmpty } from "@/components/nav/page-empty";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";
import { SpLinkButton } from "@/components/transactions/sp-link";
import { IconAdd } from "@/components/spine-ui";

export const metadata: Metadata = { title: "Balances" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** Company balances (accounts we top up). The owner manages, members read. */
export default async function BalancesPage() {
  const [user, dates, res] = await Promise.all([requireUser("/balances"), getDateSettings(), getBalances()]);
  const owner = isOwner(user);
  const today = todayIn(dates.zone);

  const header = (
    <PageHeader
      back={{ href: "/", label: "Back to Company" }}
      title="Balances"
      subtitle={owner ? "Company · accounts you top up" : "Company · view only"}
      action={owner ? <HeaderAddLink href="/balances/new" label="Add a balance" /> : undefined}
    />
  );

  if (!res.ok) {
    return (
      <div className="flex flex-col gap-[16px]">
        {header}
        <EmptyState
          className={PLAIN_STATE_ICON}
          tone="danger"
          icon={<IconError />}
          title="Could not load"
          text="Balances could not be loaded. Please try again later."
        />
      </div>
    );
  }

  const items = [...res.data.items].sort(byUrgency);
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-[16px]">
        {header}
        <PageEmpty
          icon={<BalancesIcon className="size-[26px]" />}
          tone="accent"
          title="No balances yet"
          text={
            owner
              ? "Add an account you top up, like an API or a toll pass. Spine guesses when it runs out and warns you."
              : "The owner has not added any. Accounts you top up will show here."
          }
          action={
            owner ? (
              <SpLinkButton href="/balances/new" size="lg" icon={<IconAdd aria-hidden />} data-testid="balances-add-first">
                Add a balance
              </SpLinkButton>
            ) : undefined
          }
        />
      </div>
    );
  }

  // "Next to run out": the first one not empty yet, with an empty date.
  const next = items.find((b) => !b.empty && b.emptyDate && b.emptyDate >= today);
  const nextText = next?.emptyDate
    ? `${next.name} · ${daysBetween(today, next.emptyDate) === 0 ? "today" : `in ${inWords(daysBetween(today, next.emptyDate))}`}`
    : "Nothing soon";

  return (
    <div className="flex flex-col gap-[16px]">
      {header}
      <BalanceCard
        tag="Company"
        amountLabel="Cuts a month (guessed)"
        amount={formatMoney(res.data.summary.perMonth)}
        detail={{ label: "Need a recharge", value: String(res.data.summary.needRecharge) }}
        footer={{ label: "Next to run out", value: nextText }}
      />
      <section className="rounded-(--sp-radius) bg-(--sp-panel) px-[4px] py-[6px]" data-testid="balances-list">
        {items.map((b) => (
          <BalanceRow key={b.id} b={b} today={today} dateFormat={dates.dateFormat} />
        ))}
      </section>
      <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
        Guessed from the cut and how often. Most urgent first.
      </p>
    </div>
  );
}
