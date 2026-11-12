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
import { formatMoney, signedMoney, txDirection } from "@/lib/transactions-types";
import { getDashboard, getRecurring, getWalletCategories } from "@/lib/wallet-server";
import { movedIntoGoals, savingsOf, type Budget } from "@/lib/wallet-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { LinkAddPill, LinkQuickAction, QuickActionsPanel } from "@/components/home/home-links";
import { LockWalletIconButton, SheetPill, SheetQuickAction, WalletSheets } from "@/components/home/space-actions";
import { ProgressBar, statusText } from "@/components/wallet/progress";
import { WalletDueCard } from "@/components/wallet/wallet-due-card";
import { WalletLoadError } from "@/components/wallet/wallet-page-head";

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
      <WalletLoadError what="Your wallet" />
    );
  }
  const d = res.data;
  const month = d.thisMonth;
  const today = todayIn(dates.zone);
  const savings = savingsOf(d.goals);
  // All money now in goals: the API's own total, else the sum of the goals.
  const savedInGoals = d.savedInGoals ?? savings.saved;
  // Money moved into goals this month (the Savings card's "In").
  const savedThisMonth = movedIntoGoals(d.goals, today.slice(0, 7));

  return (
    <WalletSheets today={today} categories={categories.ok ? categories.data : []}>
      <div className="sp-space-wallet flex flex-col gap-[16px]">
        <PageHeader title="Wallet" subtitle="Personal · only you" action={<LockWalletIconButton />} />

        <SwapStack
        glass
          labels={["Personal wallet", "Savings"]}
          cards={[
            <div key="wallet" className="sp-card-sun">
              <BalanceCard
                glass
                tag="Personal wallet"
                amountLabel="Balance"
                // The balance is a state, not a movement: no "+" (a "−" stays when below 0).
                amount={Number(d.balance ?? 0) < 0 ? signedMoney(d.balance ?? "0", "net") : formatMoney(d.balance ?? "0")}
                detail={month ? { label: "In", value: signedMoney(month.in, "in") } : undefined}
                footer={
                  month
                    ? { label: "Out this month", value: signedMoney(month.out, "out"), direction: Number(month.out) ? "out" : undefined }
                    : undefined
                }
                action={<LinkAddPill glass href="/wallet/transactions/new" label="Expense" testId="wallet-add-expense" />}
              />
            </div>,
            <div key="savings" className="sp-card-ink" data-testid="wallet-savings-card">
              {savings.count === 0 ? (
                <BalanceCard
                  glass
                  tag="Savings"
                  amountLabel="Saved in goals"
                  amount={formatMoney(0)}
                  footer={{ label: "Savings", value: "No savings goal yet" }}
                  action={<SheetPill glass sheet="goal" label="Set a goal" icon={<IconGoal aria-hidden />} />}
                />
              ) : (
                <BalanceCard
                  glass
                  tag={`Savings · ${savings.count} ${savings.count === 1 ? "goal" : "goals"}`}
                  amountLabel="Saved in goals"
                  amount={formatMoney(savedInGoals)}
                  detail={{ label: "In", value: signedMoney(savedThisMonth, "in") }}
                  footer={{
                    label: "Progress",
                    value: `${savings.percent}% of ${formatMoney(savings.target)}`,
                  }}
                  action={
                    <LinkAddPill glass href="/wallet/goals" label="Goals" icon={<IconGoal aria-hidden />} testId="savings-goals" />
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
              const dir = txDirection(tx.type);
              return (
                <ListItem
                  key={tx.id}
                  href={`/wallet/transactions/${encodeURIComponent(tx.id)}`}
                  icon={<TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />}
                  title={tx.description || tx.category.name}
                  meta={`${tx.category.name} • ${formatDay(tx.date, dates)}`}
                  amount={signedMoney(tx.amount, dir)}
                  tone={dir === "in" ? "income" : "expense"}
                />
              );
            })
          )}
        </SectionCard>

        <div className="flex justify-center">
          <Link
            href="/wallet/categories"
            className="inline-flex min-h-[44px] items-center py-[8px] gap-[8px] rounded-full bg-(--sp-panel) px-[18px] text-[0.8125rem] leading-snug font-medium text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] [&_svg]:size-[18px]"
          >
            <IconCategories aria-hidden />
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
    <li className="flex flex-col gap-[6px]">
      <div className="flex items-baseline justify-between gap-[8px] text-[0.75rem] leading-snug">
        <span className="min-w-0 truncate font-medium text-(--sp-text)">{name}</span>
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
    <div className="flex flex-col items-start gap-[12px] px-[14px] pb-[12px]">
      <p className="text-[0.75rem] leading-snug text-(--sp-text-muted)">{text}</p>
      <Link
        href={href}
        className="inline-flex min-h-[44px] items-center py-[8px] rounded-full bg-(--sp-chip-active) px-[18px] text-[0.8125rem] leading-snug font-medium text-(--sp-chip-active-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97]"
      >
        {cta}
      </Link>
    </div>
  );
}
