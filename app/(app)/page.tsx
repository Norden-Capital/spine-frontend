import Link from "next/link";
import { Ellipsis, Lock, Plus, ScanLine, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { displayName } from "@/lib/auth-types";
import { formatDay, todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getMonth } from "@/lib/transactions-server";
import { formatMoney, monthOf, type Currency, type Transaction } from "@/lib/transactions-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { BalanceCard, CardStack, GreetingHeader, ListItem, SectionCard } from "@/components/spine-ui";
import { LinkAddPill, LinkPeekCard, LinkQuickAction, QuickActionsPanel } from "@/components/home/home-links";

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** Home (Design kit, reference layout): greeting, cards, quick actions, recent expenses. */
export default async function HomePage() {
  const [user, dates] = await Promise.all([requireUser("/"), getDateSettings()]);
  const month = monthOf(todayIn(dates.zone));
  const res = await getMonth(month);
  const items = res.ok ? res.data.items : [];
  const expenses = items.filter((t) => t.type === "EXPENSE");

  // The card shows this month's company expenses in the main currency
  // (USD, or MAD when there are only MAD expenses).
  const currency: Currency = expenses.some((t) => t.currency === "USD") || expenses.length === 0 ? "USD" : "MAD";
  const out = res.ok ? res.data.totals[currency]?.out ?? "0" : "0";
  const count = expenses.filter((t) => t.currency === currency).length;
  const name = displayName(user);
  const first = user.firstName?.trim() || name.split(/[\s@]/)[0];

  const recent = [...items]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col">
      <GreetingHeader title={`Hello ${first}!`} subtitle="Let's track your spending." />

      <CardStack
        className="mt-[16.3px]"
        back={<LinkPeekCard href="/wallet" label="Personal wallet" trailing={<Lock aria-hidden />} />}
        front={
          <BalanceCard
            tag="Company"
            amountLabel="This month"
            amount={formatMoney(out, currency)}
            detail={{ label: "Expenses", value: String(count) }}
            footer={{ label: "Name", value: name }}
            action={<LinkAddPill href="/transactions/new" label="Expense" />}
          />
        }
      />

      <QuickActionsPanel className="mt-[25.4px]">
        <LinkQuickAction href="/transactions/new" label="Add" icon={<Plus />} />
        <LinkQuickAction href="/transactions/new?scan=1" label="Scan" icon={<ScanLine />} />
        <LinkQuickAction href="/transactions?search=1" label="Search" icon={<Search />} />
        <LinkQuickAction href="/transactions" label="More" icon={<Ellipsis />} />
      </QuickActionsPanel>

      <SectionCard
        className="mt-[17.2px]"
        title="Recent Expenses"
        action={{ label: "View All", href: "/transactions" }}
      >
        {!res.ok ? (
          <p className="px-[14px] pt-1 pb-3 text-[12px] text-(--sp-text-faint)">Could not load. Please try again later.</p>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-[14px] pt-1 pb-3">
            <p className="text-[12px] text-(--sp-text-faint)">Nothing this month yet.</p>
            <Link
              href="/transactions/new"
              className="inline-flex h-11 items-center rounded-full bg-(--sp-pill) px-5 text-[13px] font-medium text-(--sp-pill-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
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
  const income = tx.type === "INCOME";
  return (
    <ListItem
      href={`/transactions/${encodeURIComponent(tx.id)}`}
      icon={<TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />}
      title={tx.description || tx.category.name}
      meta={`${tx.category.name} • ${day}`}
      amount={formatMoney(tx.amount, tx.currency, income ? "+" : undefined)}
      tone={income ? "income" : "expense"}
    />
  );
}
