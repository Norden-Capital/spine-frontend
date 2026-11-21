"use client";

// Budgets v4 — DESIGN MOCKS ONLY (dev). Fake data, "today" = Sat 21 Nov 2026. No charts.
// The bar is now 3 short lines with gaps: On track (0–80 %) · Near limit (80–100 %) · Over (100 %+).
// The list cards have no edit / delete / past months buttons: a tap on a card opens its page,
// where edit and delete live, with this month and the past months.

import type { ReactNode } from "react";
import { IconChevronRight, IconDelete, IconEdit, IconError, IconSuccess, IconWarning, PageHeader, PinDots, PinPad as KitPinPad, SpPanel } from "@/components/spine-ui";
import { IconGrip } from "@/components/catalog/catalog-dnd";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "over";
const tone = (p: number): Tone => (p >= 100 ? "over" : p >= 80 ? "warn" : "ok");
/** One icon per part / status (drawn icons have a fixed inline size, so it is set with style). */
function ToneIcon({ t, size = 14 }: { t: Tone; size?: number }) {
  const Icon = t === "over" ? IconError : t === "warn" ? IconWarning : IconSuccess;
  return <Icon aria-hidden style={{ width: size, height: size }} className="shrink-0" />;
}

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-(--sp-text-muted)",
  warn: "text-(--sp-warning)",
  over: "text-(--sp-danger)",
};

function Page({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-[16px] pb-[24px]">{children}</div>;
}

/**
 * The 3-part bar. Each part fills in its own colour:
 * On track = 0–80 % (ink), Near limit = 80–100 % (amber), Over = 100–120 %+ (red).
 */
function TriBar({ percent, onCard, labels, thin }: { percent: number; onCard?: boolean; labels?: boolean; thin?: boolean }) {
  const parts = [
    { from: 0, to: 80, grow: 4, fill: onCard ? "bg-white" : "bg-(--sp-text)", label: "On track", t: "ok" as Tone },
    { from: 80, to: 100, grow: 1, fill: onCard ? "bg-white" : "bg-(--sp-warning)", label: "Near limit", t: "warn" as Tone },
    { from: 100, to: 120, grow: 1, fill: onCard ? "bg-white" : "bg-(--sp-danger)", label: "Over", t: "over" as Tone },
  ];
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex gap-[5px]">
        {parts.map((p) => {
          const f = Math.max(0, Math.min(1, (percent - p.from) / (p.to - p.from)));
          return (
            <div
              key={p.label}
              className={cn("relative overflow-hidden rounded-full", thin ? "h-[6px]" : "h-[10px]", onCard ? "bg-white/25" : "bg-(--sp-soft)")}
              style={{ flexGrow: p.grow, flexBasis: 0 }}
            >
              <div className={cn("h-full rounded-full", p.fill)} style={{ width: `${f * 100}%` }} />
            </div>
          );
        })}
      </div>
      {labels ? (
        <div className={cn("flex flex-wrap gap-x-[14px] gap-y-[4px] text-[0.6875rem]", onCard ? "text-(--sp-card-front-muted)" : "text-(--sp-text-muted)")}>
          {parts.map((p) => (
            <span key={p.label} className="flex items-center gap-[4px]">
              <ToneIcon t={p.t} size={12} />
              <span className="truncate">{p.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ 1. Budgets list */

type B = { name: string; icon: string; limit: string; spent: string; left: string; over?: boolean; percent: number; perDay?: string };

const BUDGETS: B[] = [
  { name: "All spending", icon: "banknote", limit: "9,000.00", spent: "6,240.00", left: "2,760.00", percent: 69, perDay: "276.00" },
  { name: "Groceries", icon: "shopping-cart", limit: "2,000.00", spent: "1,720.00", left: "280.00", percent: 86, perDay: "28.00" },
  { name: "Eating out", icon: "utensils", limit: "1,000.00", spent: "1,130.00", left: "130.00", over: true, percent: 113 },
];

const STATUS: Record<Tone, string> = { ok: "On track", warn: "Near the limit", over: "Over the limit" };

function BudgetCard({ b }: { b: B }) {
  const t = tone(b.percent);
  return (
    <li className="flex flex-col gap-[12px] rounded-(--sp-radius) bg-(--sp-panel) pt-[10px] pr-[8px] pb-[16px] pl-[14px]">
      <div className="flex items-center gap-[10.8px]">
        <span className="-ml-[8px] flex h-[44px] w-[32px] shrink-0 items-center justify-center text-(--sp-text-faint) [&_svg]:size-[20px]">
          <IconGrip />
        </span>
        <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) [&_svg]:size-[17px]">
          <CategoryIcon name={b.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] leading-normal font-medium text-(--sp-text)">{b.name}</p>
          <p className="text-[0.6875rem] leading-snug text-(--sp-text-muted) tabular-nums">{b.limit} MAD a month</p>
        </div>
        <span className="flex size-[36px] items-center justify-center text-(--sp-text-faint) [&_svg]:size-[18px]">
          <IconChevronRight aria-hidden />
        </span>
      </div>

      <div className="flex items-end justify-between pr-[6px]">
        <p className="tabular-nums">
          <span className={cn("text-[1.5rem] leading-none font-semibold", b.over ? "text-(--sp-danger)" : "text-(--sp-text)")}>{b.left}</span>
          <span className={cn("ml-[6px] text-[0.8125rem]", b.over ? "font-medium text-(--sp-danger)" : "text-(--sp-text-muted)")}>
            MAD {b.over ? "over" : "left"}
          </span>
        </p>
        <p className={cn("flex items-center gap-[5px] text-[0.8125rem] font-medium", TONE_TEXT[t])}>
          <ToneIcon t={t} />
          {STATUS[t]} · {b.percent}%
        </p>
      </div>
      <div className="pr-[6px]">
        <TriBar percent={b.percent} />
      </div>
      <p className="pr-[6px] text-[0.6875rem] leading-snug text-(--sp-text-muted) tabular-nums">
        {b.spent} spent · {b.over ? "10 days to go" : `about ${b.perDay} MAD a day for 10 days`}
      </p>
    </li>
  );
}

function MonthCard() {
  return (
    <section className="flex flex-col gap-[14px] rounded-(--sp-radius) bg-(--sp-card-front) p-[18px] text-(--sp-card-front-text)">
      <div className="flex items-center justify-between text-[0.8125rem]">
        <span className="font-medium">November</span>
        <span className="text-(--sp-card-front-muted)">10 days left</span>
      </div>
      <div>
        <p className="text-[0.75rem] text-(--sp-card-front-muted)">Spent in your budgets</p>
        <p className="mt-[2px] text-[2rem] leading-tight font-semibold tabular-nums">
          9,090.00 <span className="text-[1rem] font-medium text-(--sp-card-front-muted)">of 12,000.00 MAD</span>
        </p>
      </div>
      <TriBar percent={76} onCard />
      <div className="grid grid-cols-3 gap-[8px] border-t border-white/20 pt-[12px] text-[0.75rem]">
        <div>
          <p className="flex items-center gap-[4px] text-(--sp-card-front-muted)">
            <ToneIcon t="ok" size={12} />
            On track
          </p>
          <p className="text-[1rem] font-semibold">1</p>
        </div>
        <div>
          <p className="flex items-center gap-[4px] text-(--sp-card-front-muted)">
            <ToneIcon t="warn" size={12} />
            Near limit
          </p>
          <p className="text-[1rem] font-semibold">1</p>
        </div>
        <div>
          <p className="flex items-center gap-[4px] text-(--sp-card-front-muted)">
            <ToneIcon t="over" size={12} />
            Over
          </p>
          <p className="text-[1rem] font-semibold">1</p>
        </div>
      </div>
    </section>
  );
}

function BudgetsList() {
  return (
    <Page>
      <div className="flex flex-col gap-[8px]">
        <PageHeader back={{ href: "#", label: "Back to wallet" }} title="Budgets" />
        <p className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text-muted)">Monthly limits. Tap one to see its details.</p>
      </div>
      <MonthCard />
      <ul className="flex flex-col gap-[12px]">
        {BUDGETS.map((b) => (
          <BudgetCard key={b.name} b={b} />
        ))}
      </ul>
    </Page>
  );
}

/* ------------------------------------------------------------------ 2. A budget's page */

type M = { month: string; spent: number; percent: number };
const MONTHS: M[] = [
  { month: "October", spent: 2150, percent: 108 },
  { month: "September", spent: 1640, percent: 82 },
  { month: "August", spent: 1910, percent: 96 },
  { month: "July", spent: 2430, percent: 122 },
  { month: "June", spent: 1480, percent: 74 },
  { month: "May", spent: 1560, percent: 78 },
];
const LIMIT = 2000;
const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function MonthRow({ m }: { m: M }) {
  const diff = m.spent - LIMIT;
  const over = diff > 0;
  const t = tone(m.percent);
  return (
    <li className="flex flex-col gap-[8px] py-[12px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium text-(--sp-text)">{m.month}</p>
          <p className="text-[0.6875rem] text-(--sp-text-muted) tabular-nums">
            {fmt(m.spent)} of {fmt(LIMIT)} MAD
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-[0.9375rem] font-semibold tabular-nums", over ? "text-(--sp-danger)" : "text-(--sp-income)")}>{fmt(Math.abs(diff))}</p>
          <p className={cn("flex items-center justify-end gap-[4px] text-[0.6875rem]", TONE_TEXT[t])}>
            <ToneIcon t={t} size={12} />
            {over ? "over the limit" : "under the limit"} · {m.percent}%
          </p>
        </div>
      </div>
      <TriBar percent={m.percent} thin />
    </li>
  );
}

function History({ empty }: { empty?: boolean }) {
  return (
    <Page>
      <div className="flex flex-col gap-[8px]">
        <PageHeader
          back={{ href: "#", label: "Back to budgets" }}
          title="Groceries"
          action={
            <div className="flex items-center gap-[8px]">
              <span className="flex size-[44px] items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) [&_svg]:size-[20px]">
                <IconEdit aria-hidden />
              </span>
              <span className="flex size-[44px] items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-danger) [&_svg]:size-[20px]">
                <IconDelete aria-hidden />
              </span>
            </div>
          }
        />
        <p className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text-muted)">Budget · 2,000.00 MAD a month</p>
      </div>

      <section className="flex flex-col gap-[14px] rounded-(--sp-radius) bg-(--sp-card-front) p-[18px] text-(--sp-card-front-text)">
        <div className="flex items-center justify-between text-[0.8125rem]">
          <span className="font-medium">November</span>
          <span className="text-(--sp-card-front-muted)">10 days left</span>
        </div>
        <div>
          <p className="text-[0.75rem] text-(--sp-card-front-muted)">Left this month</p>
          <p className="mt-[2px] text-[2rem] leading-tight font-semibold tabular-nums">
            280.00 <span className="text-[1rem] font-medium text-(--sp-card-front-muted)">of 2,000.00 MAD</span>
          </p>
        </div>
        <TriBar percent={86} onCard labels />
        <p className="text-[0.75rem] text-(--sp-card-front-muted) tabular-nums">1,720.00 spent · near the limit (86%) · about 28.00 MAD a day</p>
      </section>

      {empty ? (
        <SpPanel title="Past months">
          <div className="flex flex-col items-center gap-[6px] py-[18px] text-center">
            <span className="flex size-[46px] items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text-muted) [&_svg]:size-[20px]">
              <CategoryIcon name="calendar" />
            </span>
            <p className="text-[0.875rem] font-medium text-(--sp-text)">No past months yet</p>
            <p className="max-w-[260px] text-[0.75rem] leading-snug text-(--sp-text-muted)">November shows here from 1 December.</p>
          </div>
        </SpPanel>
      ) : (
        <>
          <SpPanel title="Last 6 months">
            <div className="grid grid-cols-3 gap-[8px]">
              {[
                ["Average", "1,861.67"],
                ["Under the limit", "4 of 6"],
                ["Biggest", "Jul · 2,430"],
              ].map(([k, v]) => (
                <div key={k} className="flex min-w-0 flex-col gap-[2px] rounded-[16px] bg-(--sp-soft) px-[12px] py-[10px]">
                  <span className="truncate text-[0.6875rem] text-(--sp-text-muted)">{k}</span>
                  <span className="truncate text-[0.9375rem] font-semibold text-(--sp-text) tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </SpPanel>

          <SpPanel title="Past months">
            <ul className="-my-[8px] flex flex-col divide-y divide-(--sp-divider)">
              {MONTHS.map((m) => (
                <MonthRow key={m.month} m={m} />
              ))}
            </ul>
          </SpPanel>
          <p className="px-[4px] text-[0.75rem] leading-snug text-(--sp-text-muted)">
            Months before 20 Nov 2026 use today&apos;s limit. From now on, each month keeps its own limit.
          </p>
        </>
      )}
    </Page>
  );
}

/* ------------------------------------------------------------------ 3. PIN delete key */

function Pin({ big }: { big: boolean }) {
  return (
    <div className="flex flex-col items-center gap-[24px] pt-[24px] text-center">
      <div>
        <h1 className="text-[1.375rem] leading-snug font-medium text-(--sp-text)">Enter your wallet PIN</h1>
        <p className="mt-[4px] text-[0.8125rem] text-(--sp-text-muted)">{big ? "After: bigger delete key" : "Before: today"}</p>
      </div>
      <div className="flex w-full flex-col items-center gap-8">
        <PinDots length={6} filled={3} />
        <KitPinPad
          onDigit={() => {}}
          onDelete={() => {}}
          className={big ? "[&_button[aria-label=Delete]_svg]:size-[40px]! [&_button[aria-label=Delete]]:size-[80px]! [&_button[aria-label=Delete]]:-m-[4px]" : undefined}
        />
      </div>
    </div>
  );
}

export const BUDGET_HISTORY_MOCKS: Record<string, () => ReactNode> = {
  "budget-1-list": () => <BudgetsList />,
  "budget-2-history": () => <History />,
  "budget-3-history-new": () => <History empty />,
  "pin-1-before": () => <Pin big={false} />,
  "pin-2-after": () => <Pin big />,
};
