import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, PiggyBank, Plus, Shapes, Target } from "lucide-react";
import { formatDay } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { formatMoney, formatNet, type Currency } from "@/lib/transactions-types";
import { getDashboard } from "@/lib/wallet-server";
import type { Budget, Goal } from "@/lib/wallet-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { LinkAddPill, LinkPeekCard, LinkQuickAction, QuickActionsPanel } from "@/components/home/home-links";
import { BalanceCard, CardStack, GreetingHeader, ListItem, SectionCard } from "@/components/spine-ui";
import { TotalsPanel } from "@/components/transactions/tx-list";
import { LockWalletButton } from "@/components/wallet/lock-button";
import { ProgressBar, statusText } from "@/components/wallet/progress";

export const metadata: Metadata = { title: "Wallet" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** Wallet dashboard (reference style): balances, month, actions, budgets, goals, recent. */
export default async function WalletPage() {
  const [res, dates] = await Promise.all([getDashboard(), getDateSettings()]);
  if (!res.ok) {
    return (
      <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
        Your wallet could not be loaded. Please try again later.
      </p>
    );
  }
  const d = res.data;
  const usd = d.balance.USD ?? "0.00";
  const mad = d.balance.MAD ?? "0.00";
  // Front card: USD, unless only MAD is used.
  const main: Currency = Number(usd) === 0 && Number(mad) !== 0 ? "MAD" : "USD";
  const other: Currency = main === "USD" ? "MAD" : "USD";
  const month = d.thisMonth[main];

  return (
    <div className="flex flex-col">
      <GreetingHeader title="Wallet" subtitle="Your personal money. Only you can see it." />

      <CardStack
        className="mt-[16.3px]"
        back={[
          <LinkPeekCard
            key={other}
            tone="ink"
            href={`/wallet/transactions?currency=${other}`}
            label={`Balance · ${formatMoney(d.balance[other] ?? "0", other)}`}
          />,
        ]}
        front={
          <BalanceCard
            tag="Personal"
            amountLabel={`${main} balance`}
            amount={formatNet(d.balance[main] ?? "0", main).replace(/^\+/, "")}
            detail={month ? { label: "This month", value: formatNet(month.net, main) } : undefined}
            footer={month ? { label: "Spent this month", value: formatMoney(month.out, main) } : undefined}
            action={<LinkAddPill href="/wallet/transactions/new" label="Add" />}
          />
        }
      />

      <QuickActionsPanel className="mt-[25.4px]">
        <LinkQuickAction href="/wallet/transactions/new" label="Add" icon={<Plus />} />
        <LinkQuickAction href="/wallet/budgets" label="Budgets" icon={<PiggyBank />} />
        <LinkQuickAction href="/wallet/goals" label="Goals" icon={<Target />} />
        <LinkQuickAction href="/wallet/recurring" label="Recurring" icon={<CalendarClock />} />
      </QuickActionsPanel>

      <div className="mt-[17.2px] flex flex-col gap-[17.2px]">
        <TotalsPanel totals={d.thisMonth} />

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

        <SectionCard title="Goals" action={{ label: "View All", href: "/wallet/goals" }}>
          {d.goals.length === 0 ? (
            <Hint href="/wallet/goals" text="Save for something: a trip, a phone, a rainy day." cta="Add a goal" />
          ) : (
            <ul className="flex flex-col gap-4 px-[14px] pb-3">
              {d.goals.slice(0, 3).map((g) => (
                <GoalRow key={g.id} g={g} />
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent activity" action={{ label: "View All", href: "/wallet/transactions" }}>
          {d.recent.length === 0 ? (
            <Hint href="/wallet/transactions/new" text="Nothing yet." cta="Add your first one" />
          ) : (
            d.recent.map((tx) => {
              const income = tx.type === "INCOME";
              return (
                <ListItem
                  key={tx.id}
                  href={`/wallet/transactions/${encodeURIComponent(tx.id)}`}
                  icon={<CategoryIcon name={tx.category.icon} />}
                  title={tx.description || tx.category.name}
                  meta={`${tx.category.name} • ${formatDay(tx.date, dates)}`}
                  amount={formatMoney(tx.amount, tx.currency, income ? "+" : "-")}
                  tone={income ? "income" : "expense"}
                />
              );
            })
          )}
        </SectionCard>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/wallet/categories"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-(--sp-panel) px-4 text-[13px] text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            <Shapes className="size-4" aria-hidden />
            Categories &amp; tags
          </Link>
          <LockWalletButton />
        </div>
      </div>
    </div>
  );
}

function BudgetRow({ b }: { b: Budget }) {
  const name = b.category ? b.category.name : `All ${b.currency}`;
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="truncate font-medium text-(--sp-text)">{name}</span>
        <span className="shrink-0 text-(--sp-text-faint) tabular-nums">
          {formatMoney(b.spent, b.currency)} / {formatMoney(b.limit, b.currency)}
        </span>
      </div>
      <ProgressBar percent={b.percent} status={b.status} label={`${name}: ${statusText(b.status, b.percent)}`} />
    </li>
  );
}

function GoalRow({ g }: { g: Goal }) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="truncate font-medium text-(--sp-text)">{g.name}</span>
        <span className="shrink-0 text-(--sp-text-faint) tabular-nums">
          {formatMoney(g.saved, g.currency)} / {formatMoney(g.target, g.currency)}
        </span>
      </div>
      <ProgressBar percent={g.percent} label={`${g.name}: ${g.percent}% saved`} />
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
