import Link from "next/link";
import {
  BalanceCard,
  IconBell,
  IconExpenses,
  IconLock,
  IconRepeat,
  IconSearch,
  ListItem,
  PageHeader,
  SectionCard,
  SwapStack,
} from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { formatDay, todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getRecurringDue } from "@/lib/recurring-server";
import { getMonth } from "@/lib/transactions-server";
import { monthOf, signedMoney, txDirection, type Transaction } from "@/lib/transactions-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { LinkAddPill, LinkIconButton, LinkQuickAction, QuickActionsPanel } from "@/components/home/home-links";
import { DueSoonCard } from "@/components/recurring/due-soon-card";

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/**
 * Company home (one structure with the wallet): header, two cards (Company
 * in front, the locked Personal wallet behind, swap them), quick actions,
 * due soon, recent. The wallet balance is never loaded here (privacy).
 */
export default async function HomePage() {
  const [user, dates] = await Promise.all([requireUser("/"), getDateSettings()]);
  const today = todayIn(dates.zone);
  const month = monthOf(today);
  // The owner: repeat-expense reminders waiting ("Due soon" card; the alerts go to the owner only).
  const [res, due] = await Promise.all([getMonth(month), isOwner(user) ? getRecurringDue() : null]);
  const items = res.ok ? res.data.items : [];

  // The Company card: this month's company money (USD).
  const totals = res.ok ? res.data.totals : undefined;
  const out = totals?.out ?? "0";
  const income = totals?.in ?? "0";
  const net = totals?.net ?? "0";

  const recent = [...items]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        title="Company"
        subtitle="Norden Capital · your team's expenses"
        action={<LinkIconButton href="/transactions?search=1" label="Search" icon={<IconSearch />} />}
      />

      <SwapStack
        labels={["Company", "Personal wallet"]}
        cards={[
          <BalanceCard
            key="company"
            tag="Company"
            amountLabel="Out this month"
            amount={signedMoney(out, "out")}
            detail={{ label: "In", value: signedMoney(income, "in") }}
            footer={{ label: "Net", value: signedMoney(net, "net"), direction: "net" }}
            action={<LinkAddPill glass href="/transactions/new" label="Expense" testId="home-add-expense" />}
          />,
          // Always locked here: no wallet data is loaded on the company home.
          <div key="wallet" className="sp-card-sun" data-testid="home-wallet-card">
            <BalanceCard
              tag={
                <span className="flex items-center gap-[5px]">
                  Personal wallet <IconLock className="size-[14px]" aria-hidden />
                </span>
              }
              amountLabel="Balance"
              amount="••••••"
              detail={{ label: "Status", value: "Locked" }}
              footer={{ label: "Only you", value: "PIN to open" }}
              action={
                <LinkAddPill glass href="/wallet" label="Unlock" icon={<IconLock aria-hidden />} testId="home-wallet-unlock" />
              }
            />
          </div>,
        ]}
      />

      {/* Same for every role. No "Add": the card's "+ Expense" pill does it. */}
      <QuickActionsPanel>
        <LinkQuickAction href="/recurring" label="Repeat" icon={<IconRepeat />} />
        <LinkQuickAction href="/transactions" label="All" icon={<IconExpenses />} />
        <LinkQuickAction href="/alerts" label="Alerts" icon={<IconBell />} />
        <LinkQuickAction href="/transactions?search=1" label="Search" icon={<IconSearch />} />
      </QuickActionsPanel>

      {due?.ok && <DueSoonCard items={due.data} dates={dates} today={today} />}

      <SectionCard title="Recent" action={{ label: "View All", href: "/transactions" }}>
        {!res.ok ? (
          <p className="px-[14px] pt-[4px] pb-[12px] text-[0.75rem] leading-snug text-(--sp-text-muted)">
            Could not load. Please try again later.
          </p>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-start gap-[12px] px-[14px] pt-[4px] pb-[12px]">
            <p className="text-[0.75rem] leading-snug text-(--sp-text-muted)">Nothing this month yet.</p>
            <Link
              href="/transactions/new"
              className="inline-flex min-h-[44px] items-center py-[8px] rounded-full bg-(--sp-chip-active) px-[18px] text-[0.8125rem] leading-snug font-medium text-(--sp-chip-active-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97]"
            >
              Add your first transaction
            </Link>
          </div>
        ) : (
          recent.map((tx) => <RecentRow key={tx.id} tx={tx} day={formatDay(tx.date, dates)} />)
        )}
      </SectionCard>
    </div>
  );
}

function RecentRow({ tx, day }: { tx: Transaction; day: string }) {
  const dir = txDirection(tx.type);
  return (
    <ListItem
      href={`/transactions/${encodeURIComponent(tx.id)}`}
      icon={<TxLogo logoUrls={tx.logoUrls} icon={tx.category.icon} />}
      title={tx.description || tx.category.name}
      meta={`${tx.category.name} • ${day}`}
      amount={signedMoney(tx.amount, dir)}
      tone={dir === "in" ? "income" : "expense"}
    />
  );
}
