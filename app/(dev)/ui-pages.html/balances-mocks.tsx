"use client";

// Balances module — DESIGN MOCKS ONLY (dev). Fake data, "today" = Sat 14 Nov 2026.
// Not wired to the app. Screens: dashboard entry, list, empty, form, detail,
// recharge sheet, fix-balance sheet, alerts, member views.

import { useState, type ReactNode } from "react";
import { BatteryEmpty, Danger, EmptyWalletAdd, EmptyWalletTime, type Icon as IconsaxIcon } from "iconsax-react";
import {
  AddPill,
  AlertRow,
  AmountField,
  Avatar,
  BalanceCard,
  DateField,
  DueBadge,
  EmptyState,
  FilterChip,
  FloatingDock,
  IconButton,
  InfoList,
  PageHeader,
  QuickAction,
  QuickActions,
  ListItem,
  RowIcon,
  SectionCard,
  Segmented,
  SpMoney,
  SpRow,
  SpButton,
  SpField,
  SpInput,
  SpPanel,
  SpSelect,
  SpTextarea,
  StatTiles,
  SwapStack,
  Timeline,
  TopBar,
  IconWarning,
  type DockItem,
} from "@/components/spine-ui";
import { cn } from "@/lib/utils";
import { TxLogo } from "@/components/expenses/tx-logo";
import { I } from "./icon-set";
import { OpenSheet } from "./client";

/* ---------- frame (same as the other mocks) ---------- */

function dock(): DockItem[] {
  return [
    { href: "#home", label: "Home", icon: <I.House />, activeIcon: <I.House fill="currentColor" />, active: true },
    { href: "#expenses", label: "Expenses", icon: <I.ArrowLeftRight /> },
    { href: "#wallet", label: "Wallet", icon: <I.Wallet /> },
    { href: "#settings", label: "Settings", icon: <I.Settings /> },
  ];
}

function Top() {
  return (
    <TopBar
      right={
        <>
          <IconButton label="Notifications" icon={<I.Bell />} dot />
          <Avatar name="Sam Tremblay" />
        </>
      }
    />
  );
}

function Page({ children, dockBar = true, fill }: { children: ReactNode; dockBar?: boolean; fill?: boolean }) {
  return (
    <>
      <Top />
      <div className={cn("mt-[16px] space-y-[16px]", fill && "flex flex-1 flex-col")}>{children}</div>
      {dockBar ? (
        <div className="pointer-events-none sticky bottom-(--sp-dock-gap) z-10 mt-auto flex justify-center pt-[24px] pb-[9px]">
          <FloatingDock position="static" items={dock()} />
        </div>
      ) : (
        <div className="h-[24px]" />
      )}
    </>
  );
}

function FormPage({ children, bar }: { children: ReactNode; bar: ReactNode }) {
  return (
    <>
      <Top />
      <div className="mt-[16px] space-y-[16px] pb-[16px]">{children}</div>
      <div className="sticky bottom-0 z-10 -mx-(--sp-gutter) bg-linear-to-t from-(--sp-bg) from-70% to-transparent px-(--sp-gutter) pt-[20px] pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {bar}
      </div>
    </>
  );
}

const bulk = (Icon: IconsaxIcon, cls = "size-[20px]") => <Icon variant="Bulk" color="currentColor" className={cls} />;

/* ---------- data ---------- */

type State = "empty" | "low" | "soon" | "ok";
type Bal = {
  id: string;
  name: string;
  site: string;
  icon: string; // category icon (fallback when the site has no logo)
  category: string;
  guess: number;
  base: number; // balance right after the last recharge / fix (bar = guess / base)
  cut: string;
  every: string;
  monthly: string;
  runs: string; // status line, plain text: "Runs out in 7 days · ~Sat 21 Nov"
  state: State;
};

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Sorted by urgency: empty, below the limit, runs out soon, then by empty date.
const BALANCES: Bal[] = [
  { id: "mailgun", name: "Mailgun", site: "mailgun.com", icon: "laptop", category: "Software › Email", guess: 0, base: 35, cut: "$35.00", every: "Once a month", monthly: "$35.00", runs: "Empty since ~Thu 12 Nov", state: "empty" },
  { id: "twilio", name: "Twilio SMS", site: "twilio.com", icon: "smartphone", category: "Software › SMS", guess: 18.4, base: 60, cut: "$6.20", every: "Every 3 days", monthly: "$62.91", runs: "Empty ~Mon 23 Nov", state: "low" },
  { id: "openai", name: "OpenAI API", site: "openai.com", icon: "laptop", category: "Software › API", guess: 41.6, base: 80, cut: "$6.40", every: "Every day", monthly: "$194.82", runs: "Runs out in 7 days · ~Sat 21 Nov", state: "soon" },
  { id: "etr", name: "407 ETR toll pass", site: "407etr.com", icon: "car", category: "Transport › Tolls", guess: 84, base: 150, cut: "$12.00", every: "8 times a month", monthly: "$96.00", runs: "Runs out in 26 days · ~Thu 10 Dec", state: "ok" },
  { id: "gads", name: "Google Ads", site: "google.com", icon: "megaphone", category: "Marketing › Ads", guess: 610, base: 1000, cut: "$90.00", every: "Every week", monthly: "$391.32", runs: "Runs out in 7 weeks · ~Sat 2 Jan", state: "ok" },
];
const TOTAL = "$780.05";

/** Right-hand status, where the pill was, but text only (no background):
 *  red + warning icon (empty / below the limit), amber + dot (runs out soon), nothing when OK. */
function StatusText({ b }: { b: Bal }) {
  if (b.state === "ok") return null;
  const red = b.state !== "soon";
  const label = b.state === "empty" ? "Empty" : b.state === "low" ? "Below $25" : "In 7 days";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-[5px] text-[0.625rem] leading-[1.5] font-medium whitespace-nowrap [&_svg]:size-[12px]",
        red ? "text-(--sp-due-red-text)" : "text-(--sp-due-soon-text)"
      )}
    >
      {red ? <IconWarning /> : <span aria-hidden className="size-[6px] rounded-full bg-current" />}
      {label}
    </span>
  );
}

const BAR: Record<State, string> = {
  empty: "bg-(--sp-danger)",
  low: "bg-(--sp-danger)",
  soon: "bg-(--sp-warning)",
  ok: "bg-(--sp-success)",
};

/* ---------- small parts ---------- */

/** The site's logo, like transactions (TxLogo: apple-touch-icon, then favicon,
 *  then the category icon when the site gives none). */
function urls(site: string) {
  return [`https://${site}/apple-touch-icon.png`, `https://${site}/favicon.ico`];
}
function Logo({ b, size = 40, onCard }: { b: Bal; size?: number; onCard?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full [&_svg]:size-[45%]", onCard ? "bg-white/15 text-white" : "bg-(--sp-soft) text-(--sp-text)")}
      style={{ width: size, height: size }}
    >
      <TxLogo logoUrls={urls(b.site)} icon={b.icon} />
    </span>
  );
}

function Bar({ value, tone, onCard, label }: { value: number; tone: string; onCard?: boolean; label: string }) {
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("block h-[6px] overflow-hidden rounded-full", onCard ? "bg-white/25" : "bg-(--sp-soft)")}
    >
      <span className={cn("block h-full rounded-full", tone)} style={{ width: `${Math.max(value * 100, value > 0 ? 4 : 0)}%` }} />
    </span>
  );
}

/** One balance: logo, name + guessed balance, bar, gray date line + status text on the right (no pill). */
function BalanceRow({ b }: { b: Bal }) {
  return (
    <a href={`#${b.id}`} className="flex gap-[12px] rounded-[16px] px-[10px] py-[10px] outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)">
      <Logo b={b} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-[10px]">
          <span className="min-w-0 truncate text-[0.8125rem] leading-[1.5] font-medium text-(--sp-text)">{b.name}</span>
          <span className="shrink-0 text-[0.8125rem] leading-[1.5] font-semibold text-(--sp-text) tabular-nums">{money(b.guess)}</span>
        </span>
        <span className="mt-[6px] block">
          <Bar value={b.guess / b.base} tone={BAR[b.state]} label={`${b.name}: ${money(b.guess)} of ${money(b.base)} left`} />
        </span>
        <span className="mt-[7px] flex items-start justify-between gap-[8px]">
          <span className="min-w-0 text-[0.6875rem] leading-snug text-(--sp-text-muted)">{b.runs}</span>
          <StatusText b={b} />
        </span>
      </span>
    </a>
  );
}

function ListPanel({ items }: { items: Bal[] }) {
  return (
    <section className="rounded-(--sp-radius) bg-(--sp-panel) px-[4px] py-[6px]">
      {items.map((b) => (
        <BalanceRow key={b.id} b={b} />
      ))}
    </section>
  );
}

function Header({ member, back }: { member?: boolean; back?: boolean }) {
  return (
    <PageHeader
      back={back ? { href: "#home", label: "Back to Company" } : undefined}
      title="Balances"
      subtitle={member ? "Company · view only" : "Company · accounts you top up"}
      action={member ? undefined : <IconButton label="Add a balance" icon={<I.Plus />} variant="ink" />}
    />
  );
}

function Summary() {
  return (
    <BalanceCard
      tag="Company"
      amountLabel="Cuts a month (guessed)"
      amount={TOTAL}
      detail={{ label: "Need a recharge", value: "2" }}
      footer={{ label: "Next to run out", value: "OpenAI API · in 7 days" }}
    />
  );
}

/* ---------- 1. entry: company dashboard ---------- */

export function BalancesEntry() {
  const plus = <I.Plus className="size-[16px]" />;
  return (
    <Page>
      <PageHeader title="Company" subtitle="Norden Capital · your team's expenses" action={<IconButton label="Search" icon={<I.Search />} />} />
      <SwapStack
        labels={["Company", "Personal wallet"]}
        cards={[
          <BalanceCard
            key="c"
            tag="Company"
            amountLabel="Out this month"
            amount="−$3,922.40"
            detail={{ label: "In", value: "+$500.00" }}
            footer={{ label: "Net", value: "−$3,422.40", direction: "net" }}
            action={<AddPill glass label="Expense" icon={plus} />}
          />,
          <div key="w" className="sp-card-sun">
            <BalanceCard
              tag={
                <span className="flex items-center gap-[5px]">
                  Personal wallet <I.Lock className="size-[14px]" />
                </span>
              }
              amountLabel="Balance"
              amount="••••••"
              detail={{ label: "Status", value: "Locked" }}
              footer={{ label: "Only you", value: "PIN to open" }}
              action={<AddPill glass label="Unlock" icon={<I.Lock className="size-[18px]" />} />}
            />
          </div>,
        ]}
      />
      {/* "Alerts" leaves the quick actions (the bell opens Alerts); "Balances" takes its slot. */}
      <QuickActions>
        <QuickAction label="Repeat" icon={<I.Repeat />} />
        <QuickAction label="All" icon={<I.ArrowLeftRight />} />
        <QuickAction label="Balances" icon={bulk(EmptyWalletTime)} />
        <QuickAction label="Search" icon={<I.Search />} />
      </QuickActions>
      {/* Due soon: as in the live app. */}
      <SectionCard title="Due soon" action={{ label: "See all", href: "#recurring" }}>
        <div className="px-[4px]">
          <SpRow
            href="#r1"
            leading={<RowIcon><TxLogo logoUrls={[]} icon="wifi" /></RowIcon>}
            title="Internet Bill"
            subtitle="Due Tue 17 Nov"
            trailing={
              <span className="flex shrink-0 flex-col items-end gap-[4px]">
                <SpMoney direction="out" className="text-[0.8125rem] font-semibold whitespace-nowrap">−$55.00</SpMoney>
                <DueBadge state="soon" label="In 3 days" />
              </span>
            }
          />
          <SpRow
            href="#r2"
            leading={<RowIcon><TxLogo logoUrls={[]} icon="house" /></RowIcon>}
            title="Office rent"
            subtitle="Due Mon 30 Nov"
            trailing={
              <span className="flex shrink-0 flex-col items-end gap-[4px]">
                <SpMoney direction="out" className="text-[0.8125rem] font-semibold whitespace-nowrap">−$1,800.00</SpMoney>
                <DueBadge state="later" label="Mon 30 Nov" />
              </span>
            }
          />
        </div>
      </SectionCard>
      {/* NEW: Balances (owner + members). Status as plain text, no pill. */}
      <SectionCard title="Balances" action={{ label: "See all", href: "#balances" }}>
        <div className="px-[4px] pb-[6px]">
          <p className="px-[10px] pb-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            <span className="font-semibold text-(--sp-text)">{TOTAL}</span> a month · 2 need a recharge
          </p>
          {BALANCES.slice(0, 2).map((b) => (
            <BalanceRow key={b.id} b={b} />
          ))}
        </div>
      </SectionCard>
      {/* Recent: as in the live app (5 latest, logo or category icon). */}
      <SectionCard title="Recent" action={{ label: "View All", href: "#transactions" }}>
        <ListItem href="#t1" icon={<TxLogo logoUrls={urls("twilio.com")} icon="smartphone" />} title="Twilio top-up" meta="Software • Sat 14 Nov" amount="−$40.00" />
        <ListItem href="#t2" icon={<TxLogo logoUrls={[]} icon="hotel" />} title="Hotel Rabat" meta="Travel • Thu 12 Nov" amount="−$120.00" />
        <ListItem href="#t3" icon={<TxLogo logoUrls={[]} icon="utensils" />} title="Client lunch" meta="Food • Thu 12 Nov" amount="−$186.40" />
        <ListItem href="#t4" icon={<TxLogo logoUrls={[]} icon="banknote" />} title="Client payment" meta="Income • Wed 11 Nov" amount="+$500.00" tone="income" />
        <ListItem href="#t5" icon={<TxLogo logoUrls={[]} icon="car" />} title="Taxi to client" meta="Transport • Wed 11 Nov" amount="−$45.00" />
      </SectionCard>
    </Page>
  );
}

/* ---------- 2. list ---------- */

export function BalancesList({ member }: { member?: boolean }) {
  return (
    <Page>
      <Header member={member} back />
      <Summary />
      <ListPanel items={BALANCES} />
      <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
        Guessed from the cut and how often. Most urgent first.
      </p>
    </Page>
  );
}

/* ---------- 3. empty ---------- */

export function BalancesEmpty({ member }: { member?: boolean }) {
  return (
    <Page fill>
      <Header member={member} back />
      <div className="flex flex-1 flex-col items-center justify-center">
        <EmptyState
          className="w-full"
          icon={bulk(EmptyWalletTime, "size-[26px]")}
          tone="accent"
          title="No balances yet"
          text={
            member
              ? "The owner has not added any. Accounts you top up will show here."
              : "Add an account you top up, like an API or a toll pass. Spine guesses when it runs out and warns you."
          }
          action={member ? undefined : <SpButton icon={<I.Plus />}>Add a balance</SpButton>}
        />
      </div>
    </Page>
  );
}

/* ---------- 4. add / edit form ---------- */

const MONEY_ICON = <span className="text-[1rem] font-medium text-(--sp-text-muted)">$</span>;

export function BalanceForm({ edit }: { edit?: boolean }) {
  const [mode, setMode] = useState("times");
  const [next, setNext] = useState<string | null>("2026-11-16");
  return (
    <FormPage
      bar={
        <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
          <SpButton variant="secondary">Cancel</SpButton>
          <SpButton>{edit ? "Save" : "Add balance"}</SpButton>
        </div>
      }
    >
      <PageHeader back={{ href: "#balances", label: "Back to Balances" }} title={edit ? "Edit balance" : "New balance"} subtitle="Company" />

      <SpPanel title="The account">
        <div className="space-y-[16px]">
          <SpField label="Name" htmlFor="b-name">
            <SpInput id="b-name" defaultValue="407 ETR toll pass" />
          </SpField>
          <SpField label="Website" optional htmlFor="b-site" hint="We show the site's logo, like on expenses.">
            <SpInput id="b-site" icon={<I.Globe />} defaultValue="407etr.com" inputMode="url" />
          </SpField>
          <SpField label="Category" htmlFor="b-cat" hint="Recharges are saved as expenses in this category.">
            <SpSelect id="b-cat" defaultValue="tolls" options={[{ value: "tolls", label: "Transport › Tolls" }, { value: "api", label: "Software › API" }]} />
          </SpField>
        </div>
      </SpPanel>

      <SpPanel title="The money">
        <div className="space-y-[16px]">
          <SpField label="Balance now" htmlFor="b-bal" hint="What the account shows today.">
            <SpInput id="b-bal" icon={MONEY_ICON} defaultValue="84.00" inputMode="decimal" className="tabular-nums" />
          </SpField>
          <SpField label="Each cut" htmlFor="b-cut">
            <SpInput id="b-cut" icon={MONEY_ICON} defaultValue="12.00" inputMode="decimal" className="tabular-nums" />
          </SpField>

          {/* How often: same style as the repeat expenses (chips + Custom…). */}
          <div className="space-y-[8px]">
            <p className="px-[4px] text-[0.8125rem] leading-snug font-medium text-(--sp-text)">How often</p>
            <div className="chip-row">
              <FilterChip surface="panel" label="Every day" />
              <FilterChip surface="panel" label="Every week" />
              <FilterChip surface="panel" label="Once a month" />
              <FilterChip surface="panel" label="Custom…" active />
            </div>
            <div className="space-y-[10px] rounded-[16px] bg-(--sp-soft) p-[10px]">
              <Segmented
                label="Kind"
                surface="page"
                value={mode}
                onValueChange={setMode}
                items={[
                  { value: "times", label: "A month" },
                  { value: "days", label: "Days" },
                  { value: "weeks", label: "Weeks" },
                ]}
              />
              <div className="flex items-center gap-[10px]">
                {mode === "times" ? null : <span className="text-[0.8125rem] font-medium text-(--sp-text)">Every</span>}
                <SpInput aria-label="How many" defaultValue={mode === "times" ? "8" : "3"} inputMode="numeric" className="w-[84px] shrink-0 bg-(--sp-panel) px-[14px] text-center tabular-nums" />
                <span className="text-[0.8125rem] text-(--sp-text-muted)">{mode === "times" ? "times a month" : mode === "days" ? "days" : "weeks"}</span>
              </div>
              <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
                {mode === "times" ? "8 cuts a month, about every 4 days." : "From 1 to 365 days."}
              </p>
            </div>
          </div>

          <DateField label="Next cut" value={next} onChange={setNext} hint="Spine counts the cuts from this day." today="2026-11-14" />
        </div>
      </SpPanel>

      <SpPanel title="Alerts">
        <div className="space-y-[16px]">
          <SpField label="Low limit" optional htmlFor="b-limit" hint="Alert when the guessed balance goes below it.">
            <SpInput id="b-limit" icon={MONEY_ICON} defaultValue="30.00" inputMode="decimal" className="tabular-nums" />
          </SpField>
          <SpField label="Warn me before it runs out" htmlFor="b-days">
            <div className="flex items-center gap-[10px]">
              <SpInput id="b-days" defaultValue="7" inputMode="numeric" className="w-[84px] shrink-0 px-[14px] text-center tabular-nums" />
              <span className="text-[0.8125rem] text-(--sp-text-muted)">days before</span>
            </div>
          </SpField>
          <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[12px] text-[0.75rem] leading-snug text-(--sp-text-2)">
            3 alerts, all on: below the limit, 7 days before empty, and when it reaches $0. Everyone in the company sees them.
          </p>
        </div>
      </SpPanel>

      <SpPanel title="Note" description="Optional.">
        <SpTextarea aria-label="Note" defaultValue="Tag on the Civic. Top up on the 407 site." />
      </SpPanel>

      {/* Live preview of the guess */}
      <div className="rounded-(--sp-radius) bg-(--sp-card-front) px-[17px] py-[16px] text-(--sp-card-front-text)">
        <p className="text-[0.75rem] leading-snug">With these numbers</p>
        <p className="mt-[6px] text-[1.25rem] leading-snug font-semibold tabular-nums">$96.00 a month</p>
        <p className="mt-[2px] text-[0.75rem] leading-snug">Runs out in 26 days, ~Thu 10 Dec</p>
      </div>

      {edit ? (
        <SpButton variant="danger" className="w-full" icon={<I.Trash2 />}>
          Delete balance
        </SpButton>
      ) : null}
    </FormPage>
  );
}

/* ---------- 5. detail ---------- */

const OPENAI = BALANCES[2];

function Hero({ member }: { member?: boolean }) {
  const b = OPENAI;
  return (
    <section className="rounded-(--sp-radius) bg-(--sp-card-front) px-[17px] pt-[16px] pb-[17px] text-(--sp-card-front-text)">
      <div className="flex items-center justify-between gap-3">
        <Logo b={b} size={44} onCard />
        <span className="text-[0.75rem] leading-snug font-medium">{member ? "View only" : "Runs out in 7 days"}</span>
      </div>
      <p className="mt-[16px] text-[0.75rem] leading-snug">Guessed balance today</p>
      <p className="mt-[2px] text-[34px] leading-[1.3] font-semibold tracking-tight tabular-nums">{money(b.guess)}</p>
      <p className="text-[0.6875rem] leading-snug">of $80.00 after the last recharge · Sun 8 Nov</p>
      <div className="mt-[12px]">
        <Bar value={b.guess / b.base} tone="bg-white" onCard label={`${money(b.guess)} of $80.00 left`} />
      </div>
      <div className="mt-[14px] flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.6875rem] leading-snug">Runs out</p>
          <p className="text-[0.9375rem] leading-snug font-medium">~Sat 21 Nov · in 7 days</p>
        </div>
        {member ? null : <AddPill glass label="Recharge" icon={bulk(EmptyWalletAdd, "size-[18px]")} />}
      </div>
    </section>
  );
}

export function BalanceDetail({ member, sheet }: { member?: boolean; sheet?: "recharge" | "fix" }) {
  return (
    <>
      <Page>
        <PageHeader
          back={{ href: "#balances", label: "Back to Balances" }}
          title={OPENAI.name}
          subtitle={`${OPENAI.site} · ${OPENAI.category}`}
          action={member ? undefined : <IconButton label="Edit balance" icon={<I.Pencil />} />}
        />
        <Hero member={member} />
        <StatTiles
          items={[
            { icon: <I.Calendar />, tone: "violet", value: "$194.82", label: "A month" },
            { icon: <I.Receipt />, tone: "sun", value: "$6.40", label: "Each cut · daily" },
            { icon: <I.Clock />, tone: "ink", value: "15 Nov", label: "Next cut · Sun" },
          ]}
        />
        {member ? null : (
          <SpButton variant="secondary" className="w-full" icon={<I.Pencil />}>
            Fix the real balance
          </SpButton>
        )}
        <InfoList
          title="Details"
          rows={[
            { label: "How often", value: "Every day" },
            { label: "Low limit", value: "$25.00 · from ~Tue 17 Nov" },
            { label: "Alerts", value: "Below limit · 7 days before · at $0" },
            { label: "Category", value: OPENAI.category },
            { label: "Note", value: "Support bot key. Top up in the OpenAI console." },
          ]}
        />
        <SpPanel title="History" aside={<span className="text-[0.625rem] text-(--sp-text-faint)">Newest first</span>}>
          <Timeline
            entries={[
              { id: "c2", current: true, title: "6 cuts (guessed)", meta: "Mon 9 – Sat 14 Nov · −$6.40 each", changes: ["−$38.40 in total"] },
              {
                id: "r1",
                title: "Recharge +$50.00 by Sam Tremblay",
                meta: "Sun 8 Nov 2026, 14:20",
                changes: ["Expense added: $50.00 · Software › API", "Proof: receipt-openai.pdf"],
              },
              { id: "f1", title: "Real balance fixed to $30.00", meta: "Sun 8 Nov 2026, 14:18", changes: ["Spine guessed $27.20 (off by $2.80)"] },
              { id: "c1", title: "7 cuts (guessed)", meta: "Sun 1 – Sat 7 Nov · −$6.40 each", changes: ["−$44.80 in total"] },
              { id: "r0", title: "Recharge +$70.00 by Sam Tremblay", meta: "Sat 31 Oct 2026, 09:02", changes: ["Expense added: $70.00 · Software › API"] },
            ]}
          />
        </SpPanel>
        {member ? (
          <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            Only the owner can recharge, edit or delete a balance.
          </p>
        ) : null}
      </Page>
      {sheet === "recharge" ? <RechargeSheet /> : sheet === "fix" ? <FixSheet /> : null}
    </>
  );
}

/* ---------- 6. recharge sheet ---------- */

const PROOF_OPTION =
  "flex min-h-[56px] w-full min-w-0 items-center justify-center gap-[10px] rounded-[16px] bg-(--sp-soft) px-[12px] py-[8px] text-left text-(--sp-text) outline-none";
const PROOF_ICON =
  "flex size-[36px] shrink-0 items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text) [&_svg]:size-[18px]";

function RechargeSheet() {
  const [value, setValue] = useState("50");
  const [day, setDay] = useState<string | null>("2026-11-14");
  const n = Number.parseFloat(value) || 0;
  return (
    <OpenSheet
      title="Recharge OpenAI API"
      description="Now about $41.60. After: about $91.60."
      footer={
        <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
          <SpButton variant="secondary">Cancel</SpButton>
          <SpButton disabled>Recharge {money(n)}</SpButton>
        </div>
      }
    >
      <div className="space-y-[16px]">
        <AmountField
            id="r-amount"
            label="Amount"
            symbol="$"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onStep={(d) => setValue((v) => String(Math.max(0, (Number.parseFloat(v) || 0) + d * 10)))}
            canDecrement={n >= 10}
          />
        <DateField label="Date" value={day} onChange={setDay} today="2026-11-14" max="2026-11-14" />
        <div className="space-y-[8px]">
          <p className="px-[4px] text-[0.8125rem] leading-snug font-medium text-(--sp-text)">
            Proof
          </p>
          <div className="grid grid-cols-2 gap-[10px]">
            <button type="button" className={PROOF_OPTION}>
              <span className={PROOF_ICON}>
                <I.Camera />
              </span>
              <span className="min-w-0 text-[0.8125rem] leading-snug font-medium break-words">Take a photo</span>
            </button>
            <button type="button" className={PROOF_OPTION}>
              <span className={PROOF_ICON}>
                <I.Paperclip />
              </span>
              <span className="min-w-0 text-[0.8125rem] leading-snug font-medium break-words">Upload a file</span>
            </button>
          </div>
          <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            Required: a photo of the receipt, or a PDF. Recharge turns on once a proof is added.
          </p>
        </div>
        <div className="flex gap-[10px] rounded-[16px] bg-[color-mix(in_oklab,var(--sp-card-front)_12%,var(--sp-panel))] px-[14px] py-[12px]">
          <span className="mt-[1px] text-(--sp-card-front) [&_svg]:size-[18px]">
            <I.Receipt />
          </span>
          <p className="text-[0.75rem] leading-snug text-(--sp-text)">
            A <span className="font-semibold">{money(n)}</span> company expense will be added: OpenAI API · Software › API · openai.com.
          </p>
        </div>
      </div>
    </OpenSheet>
  );
}

/* ---------- 5b. fix the real balance ---------- */

function FixSheet() {
  return (
    <OpenSheet
      title="Fix the real balance"
      description="Spine guessed $41.60. Type what the site shows."
      footer={
        <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
          <SpButton variant="secondary">Cancel</SpButton>
          <SpButton>Save $38.90</SpButton>
        </div>
      }
    >
      <div className="space-y-[16px]">
        <SpField label="Real balance" htmlFor="fix-amount">
          <SpInput id="fix-amount" icon={MONEY_ICON} defaultValue="38.90" inputMode="decimal" className="tabular-nums" />
        </SpField>
        <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[12px] text-[0.75rem] leading-snug text-(--sp-text-2)">
          No expense is added. The guess starts again from $38.90 and the new empty date is ~Fri 20 Nov.
        </p>
      </div>
    </OpenSheet>
  );
}

/* ---------- 7. alerts ---------- */

export function BalanceAlerts() {
  return (
    <Page>
      <PageHeader title="Alerts" subtitle="3 new" />
      <section className="rounded-(--sp-radius) bg-(--sp-panel) py-[6px]">
        <AlertRow
          unread
          tone="danger"
          icon={bulk(BatteryEmpty)}
          title="Mailgun is empty"
          message="Spine guesses $0.00 since Thu 12 Nov. Recharge it, or fix the real balance."
          time="9:00"
          href="#mailgun"
        />
        <AlertRow
          unread
          tone="danger"
          icon={bulk(Danger)}
          title="Twilio SMS is below your limit"
          message="About $18.40 left. Your limit is $25.00."
          time="8:30"
          href="#twilio"
        />
        <AlertRow
          unread
          tone="warning"
          icon={bulk(EmptyWalletTime)}
          title="OpenAI API runs out in 7 days"
          message="Guessed empty on Sat 21 Nov. About $41.60 left, $6.40 a day."
          time="8:00"
          href="#openai"
        />
        <AlertRow tone="info" icon={<I.Repeat />} title="Internet Bill is due in 3 days" message="Repeats monthly · $55.00" time="Fri" href="#r" />
      </section>
    </Page>
  );
}

/* ---------- registry ---------- */

export const BALANCE_MOCKS: Record<string, () => ReactNode> = {
  "balances-1-entry": () => <BalancesEntry />,
  "balances-2-list": () => <BalancesList />,
  "balances-3-empty": () => <BalancesEmpty />,
  "balances-4-form": () => <BalanceForm />,
  "balances-4-form-edit": () => <BalanceForm edit />,
  "balances-5-detail": () => <BalanceDetail />,
  "balances-5b-fix-sheet": () => <BalanceDetail sheet="fix" />,
  "balances-6-recharge-sheet": () => <BalanceDetail sheet="recharge" />,
  "balances-7-alerts": () => <BalanceAlerts />,
  "balances-8-member-list": () => <BalancesList member />,
  "balances-8-member-detail": () => <BalanceDetail member />,
  "balances-8-member-empty": () => <BalancesEmpty member />,
};
