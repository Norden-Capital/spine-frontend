"use client";

// Private wallet currency (MAD / USD) — DESIGN MOCKS ONLY (dev). Fake data.
// The company stays USD. Rate: 1 USD = 10.00 MAD (set by the person).

import { useState, type ReactNode } from "react";
import {
  AmountField,
  BalanceCard,
  IconButton,
  IconGoal,
  ListItem,
  PageHeader,
  SectionCard,
  Segmented,
  SpButton,
  SpField,
  SpInput,
  SpPanel,
} from "@/components/spine-ui";
import { I } from "./icon-set";
import { OpenSheet } from "./client";
import { CurrencyFlag } from "@/components/wallet/currency-flag";

const CURRENCIES = [
  { value: "MAD", label: "MAD (dirham)", icon: <CurrencyFlag currency="MAD" /> },
  { value: "USD", label: "USD (dollar)", icon: <CurrencyFlag currency="USD" /> },
];

function Page({ children, bar }: { children: ReactNode; bar?: ReactNode }) {
  return (
    <div className="flex flex-col gap-[16px] pb-[120px]">
      {children}
      {bar ? (
        <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[430px] bg-(--sp-bg) px-(--sp-gutter) pt-[12px] pb-[24px]">
          {bar}
        </div>
      ) : null}
    </div>
  );
}

/** 1. Settings › Preferences: a new "Wallet currency" panel (after Dates and time). */
function Preferences() {
  return (
    <Page>
      <PageHeader back={{ href: "#", label: "Back to settings" }} title="Preferences" subtitle="Changes show right away and are saved." />
      <SpPanel title="Dates and time">
        <p className="text-[0.75rem] text-(--sp-text-muted)">(same as today)</p>
      </SpPanel>
      <SpPanel title="Wallet currency" description="Only for your private wallet. The company stays in USD.">
        <div className="space-y-[16px]">
          <SpField label="Default currency" hint="New expenses, goals, budgets and repeats start with it. You can change it on each one.">
            <Segmented label="Default currency" surface="panel" value="MAD" items={CURRENCIES} />
          </SpField>
          <SpField label="Exchange rate" hint="Used to add MAD and USD together in your totals.">
            <div className="flex items-center gap-[10px]">
              <span className="shrink-0 text-[0.875rem] font-medium text-(--sp-text)">1 USD =</span>
              <SpInput inputMode="decimal" defaultValue="10.00" aria-label="MAD for 1 USD" className="text-right tabular-nums" />
              <span className="shrink-0 text-[0.875rem] font-medium text-(--sp-text)">MAD</span>
            </div>
          </SpField>
        </div>
      </SpPanel>
    </Page>
  );
}

function Amount({ currency }: { currency: string }) {
  const [value, setValue] = useState("2000");
  return (
    <AmountField
      id="amount"
      symbol={currency === "USD" ? "$" : "MAD"}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onStep={() => {}}
      canDecrement
    />
  );
}

/** 2. Wallet add form: a MAD / USD switch right above the amount. */
function AddForm({ currency }: { currency: "MAD" | "USD" }) {
  return (
    <Page bar={<SpButton className="w-full">Save to wallet</SpButton>}>
      <PageHeader title="Add to wallet" subtitle="Personal wallet · only you" action={<IconButton label="Close" icon={<I.X />} />} />
      <Segmented
        label="Type"
        value="expense"
        items={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />
      <Segmented
        label="Currency"
        value={currency}
        items={[
          { value: "MAD", label: "MAD", icon: <CurrencyFlag currency="MAD" /> },
          { value: "USD", label: "USD", icon: <CurrencyFlag currency="USD" /> },
        ]}
      />
      <Amount currency={currency} />
      {currency === "USD" ? (
        <p className="-mt-[8px] text-center text-[0.75rem] text-(--sp-text-muted)">≈ 20,000.00 MAD in your totals (1 USD = 10.00 MAD)</p>
      ) : null}
      <SpField label="Date" htmlFor="date">
        <SpInput id="date" type="date" defaultValue="2026-11-14" />
      </SpField>
      <SpField label="Description" htmlFor="desc">
        <SpInput id="desc" defaultValue="Rent" />
      </SpField>
    </Page>
  );
}

/** 3. Wallet home: totals in the default currency; each row in its own currency. */
function WalletHome() {
  return (
    <Page>
      <PageHeader title="Wallet" subtitle="Only you" />
      <BalanceCard
        tag="Private wallet"
        amountLabel="Available balance"
        amount="12,450.00 MAD"
        detail={{ label: "This month", value: "−2,200.00 MAD" }}
        footer={{ label: "USD counted at", value: "1 USD = 10.00 MAD" }}
      />
      <SectionCard title="Recent">
        <ul className="flex flex-col">
          <li>
            <ListItem icon={<I.Receipt />} title="Rent" meta="14 Nov 2026" amount="−2,000.00 MAD" />
          </li>
          <li>
            <ListItem icon={<I.Receipt />} title="Netflix" meta="12 Nov 2026" amount="−$20.00" />
          </li>
          <li>
            <ListItem icon={<I.Receipt />} title="Salary" meta="1 Nov 2026" amount="+15,000.00 MAD" tone="income" />
          </li>
        </ul>
      </SectionCard>
    </Page>
  );
}

/** 4. Goal sheet: its own MAD / USD choice. */
function GoalSheet() {
  return (
    <Page>
      <PageHeader back={{ href: "#", label: "Back to wallet" }} title="Goals" subtitle="Wallet" />
      <div className="flex items-center gap-[10px] rounded-(--sp-radius) bg-(--sp-panel) p-[14px]">
        <IconGoal aria-hidden className="size-[18px]" />
        <span className="text-[0.875rem]">New laptop · 4,500.00 of 12,000.00 MAD</span>
      </div>
      <OpenSheet
        title="Set a goal"
        footer={<SpButton className="w-full">Save goal</SpButton>}
      >
        <div className="space-y-[16px]">
          <SpField label="Name" htmlFor="gname">
            <SpInput id="gname" defaultValue="Trip to Japan" />
          </SpField>
          <SpField label="Currency">
            <Segmented
              label="Currency"
              surface="panel"
              value="USD"
              items={[
                { value: "MAD", label: "MAD", icon: <CurrencyFlag currency="MAD" /> },
                { value: "USD", label: "USD", icon: <CurrencyFlag currency="USD" /> },
              ]}
            />
          </SpField>
          <SpField label="Target" htmlFor="gtarget">
            <SpInput id="gtarget" inputMode="decimal" defaultValue="$4,000.00" />
          </SpField>
        </div>
      </OpenSheet>
    </Page>
  );
}

export const CURRENCY_MOCKS: Record<string, () => ReactNode> = {
  "currency-1-preferences": () => <Preferences />,
  "currency-2-form-mad": () => <AddForm currency="MAD" />,
  "currency-2-form-usd": () => <AddForm currency="USD" />,
  "currency-3-wallet": () => <WalletHome />,
  "currency-4-goal": () => <GoalSheet />,
};
