import type { Metadata } from "next";
import Link from "next/link";
import {
  BalanceCard,
  IconCalendarRepeat,
  IconCategories,
  IconGoal,
  IconSavings,
  IconSearch,
  ListItem,
  PageHeader,
  SectionCard,
  SwapStack,
} from "@/components/spine-ui";
import { formatDay, todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { formatMoney, formatNet } from "@/lib/transactions-types";
import { getDashboard, getRecurring, getWalletCategories } from "@/lib/wallet-server";
import { savingsOf, type Budget } from "@/lib/wallet-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { LinkAddPill, LinkQuickAction, QuickActionsPanel } from "@/components/home/home-links";
import { LockWalletIconButton, SheetPill, SheetQuickAction, WalletSheets } from "@/components/home/space-actions";
import { ProgressBar, statusText } from "@/components/wallet/progress";
import { WalletDueCard } from "@/components/wallet/wallet-due-card";

export const metadata: Metadata = { title: "Wallet" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/**
 * Wallet dashboard (one structure with the company home): header with lock,
 * two cards (Personal wallet in front, Savings behind, swap them), quick
 * actions, due soon, budgets, recent.
 */
export default async function WalletPage() {
  const [res, dates, recurring, categories] = await Promise.all([
    getDashboard(),
    getDateSettings(),
    getRecurring(),
    getWalletCategories(),
  ]);
  if (!res.ok) {
    return (
      <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
        Your wallet could not be loaded. Please try again later.
      </p>
    );
  }
  const d = res.data;
  const month = d.thisMonth;
  const today = todayIn(dates.zone);
  const savings = savingsOf(d.goals);

  return (
    <WalletSheets today={today} categories={categories.ok ? categories.data : []}>
      <div className="sp-space-wallet flex flex-col gap-[16px]">
        <PageHeader title="Wallet" subtitle="Personal · only you" action={<LockWalletIconButton />} />

        <SwapStack
          labels={["Personal wallet", "Savings"]}
          cards={[
            <div key="wallet" className="sp-card-sun">
              <BalanceCard
                tag="Personal wallet"
                amountLabel="Balance"
                amount={formatNet(d.balance ?? "0").replace(/^\+/, "")}
                detail={month ? { label: "This month", value: formatNet(month.net) } : undefined}
                footer={month ? { label: "Out this month", value: formatMoney(month.out) } : undefined}
                action={<LinkAddPill href="/wallet/transactions/new" label="Expense" testId="wallet-add-expense" />}
              />
            </div>,
            <div key="savings" className="sp-card-ink" data-testid="wallet-savings-card">
              {savings.count === 0 ? (
                <BalanceCard
                  tag="Savings"
                  amountLabel="Saved in goals"
                  amount={formatMoney(0)}
                  footer={{ label: "Savings", value: "No savings goal yet" }}
                  action={<SheetPill sheet="goal" label="Set a goal" icon={<IconGoal aria-hidden />} />}
                />
              ) : (
                <BalanceCard
                  tag={`Savings · ${savings.count} ${savings.count === 1 ? "goal" : "goals"}`}
                  amountLabel="Saved in goals"
                  amount={formatMoney(savings.saved)}
                  detail={{ label: "Target", value: formatMoney(savings.target) }}
                  footer={{
                    label: "Progress",
                    value: `${savings.percent}% · ${savings.next ? `${savings.next.name} next` : "All reached"}`,
                  }}
                  action={
                    <LinkAddPill href="/wallet/goals" label="Goals" icon={<IconGoal aria-hidden />} testId="savings-goals" />
                  }
                />
              )}
            </div>,
          ]}
        />

        {/* No "Add": the card's "+ Expense" pill does it. */}
        <QuickActionsPanel>
          <LinkQuickAction href="/wallet/recurring" label="Recurring" icon={<IconCalendarRepeat />} />
          <SheetQuickAction sheet="goal" label="Set a goal" icon={<IconGoal />} />
          <SheetQuickAction sheet="budget" label="Set a budget" icon={<IconSavings />} />
          <LinkQuickAction href="/wallet/transactions?search=1" label="Search" icon={<IconSearch />} />
        </QuickActionsPanel>

        {recurring.ok && <WalletDueCard items={recurring.data} today={today} dateFormat={dates.dateFormat} />}

        <SectionCard title="Budgets this month" action={{ label: "View All", href: "/wallet/budgets" }}>
          {d.budgets.length === 0 ? (
            <Hint href="/wallet/budgets" text="Set a monthly limit to see how much is left." cta="Add a budget" />
          ) : (
            <ul className="flex flex-col gap-4 px-[14px] pb-3">
              {d.budgets.slice(0, 3).map((b) => (
                <BudgetRow key={b.id} b={b} />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent" action={{ label: "View All", href: "/wallet/transactions" }}>
          {d.recent.length === 0 ? (
            <Hint href="/wallet/transactions/new" text="Nothing yet." cta="Add your first one" />
          ) : (
            d.recent.map((tx) => {
              const income = tx.type === "INCOME";
              return (
                <ListItem
                  key={tx.id}
                  href={`/wallet/transactions/${encodeURIComponent(tx.id)}`}
                  icon={<TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />}
                  title={tx.description || tx.category.name}
                  meta={`${tx.category.name} • ${formatDay(tx.date, dates)}`}
                  amount={formatMoney(tx.amount, income ? "+" : "-")}
                  tone={income ? "income" : "expense"}
                />
              );
            })
          )}
        </SectionCard>

        <div className="flex justify-center">
          <Link
            href="/wallet/categories"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-(--sp-panel) px-4 text-[13px] text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            <IconCategories className="size-4" aria-hidden />
            Categories
          </Link>
        </div>
      </div>
    </WalletSheets>
  );
}

function BudgetRow({ b }: { b: Budget }) {
  const name = b.category ? b.category.name : "All spending";
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="truncate font-medium text-(--sp-text)">{name}</span>
        <span className="shrink-0 text-(--sp-text-faint) tabular-nums">
          {formatMoney(b.spent)} / {formatMoney(b.limit)}
        </span>
      </div>
      <ProgressBar percent={b.percent} status={b.status} label={`${name}: ${statusText(b.status, b.percent)}`} />
    </li>
  );
}

function Hint({ href, text, cta }: { href: string; text: string; cta: string }) {
  return (
    <div className="flex flex-col items-start gap-3 px-[14px] pb-3">
      <p className="text-[12px] text-(--sp-text-faint)">{text}</p>
      <Link
        href={href}
        className="inline-flex h-11 items-center rounded-full bg-(--sp-pill) px-5 text-[13px] font-medium text-(--sp-pill-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
      >
        {cta}
      </Link>
    </div>
  );
}
