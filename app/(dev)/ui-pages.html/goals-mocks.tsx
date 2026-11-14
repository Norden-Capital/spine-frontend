"use client";

// Wallet goals reorder — DESIGN MOCKS ONLY (dev). Fake data.
// The grip sits on the title row of each goal card, left of the goal icon,
// like the categories page. Long-press (phone) or drag (mouse) the grip.

import type { ReactNode } from "react";
import { IconAdd, IconChevronDown, IconGoal, PageHeader, SpButton } from "@/components/spine-ui";
import { IconGrip } from "@/components/catalog/catalog-dnd";
import { ProgressBar } from "@/components/wallet/progress";
import { cn } from "@/lib/utils";
import { GoalsManager } from "@/components/wallet/goals-manager";
import { PrefsProvider } from "@/components/prefs/prefs-provider";
import { DEFAULT_PREFERENCES } from "@/lib/prefs";
import type { Goal } from "@/lib/wallet-types";

type G = { name: string; saved: string; target: string; percent: number; by?: string };

const GOALS: G[] = [
  { name: "New laptop", saved: "$450.00", target: "$1,200.00", percent: 37, by: "30 Jun 2027" },
  { name: "Trip to Japan", saved: "$1,100.00", target: "$4,000.00", percent: 27 },
  { name: "Rainy day fund", saved: "$300.00", target: "$1,000.00", percent: 30, by: "31 Dec 2026" },
];

function Grip({ lifted }: { lifted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        // 44px tall (touch size), centred on the title row, in line with the goal icon.
        "-ml-[8px] flex h-[44px] w-[32px] shrink-0 cursor-grab items-center justify-center rounded-xl [&_svg]:size-[20px]",
        lifted ? "text-(--sp-text-muted)" : "text-(--sp-text-faint)"
      )}
    >
      <IconGrip />
    </span>
  );
}

function Card({ g, open, lifted, children }: { g: G; open?: boolean; lifted?: boolean; children?: ReactNode }) {
  return (
    <li
      className={cn(
        "flex list-none flex-col gap-[14px] rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[10px] pb-[16px]",
        lifted && "relative z-10 scale-[1.02] shadow-[0_12px_32px_rgb(0_0_0/0.22)]"
      )}
    >
      {/* Title row: grip · icon · name · chevron, all on one line. */}
      <div className="flex min-h-[52px] items-center gap-[2px]">
        <Grip lifted={lifted} />
        <div className="-mr-[6px] flex min-w-0 flex-1 items-center gap-[10.8px] rounded-2xl px-[6px] py-[4px]">
          <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sp-card-front)_14%,var(--sp-panel))] text-(--sp-card-front) [&_svg]:size-[15px]">
            <IconGoal aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] leading-normal font-medium text-(--sp-text)">{g.name}</span>
            <span className="mt-[2px] block text-[0.6875rem] leading-snug text-(--sp-text-muted) tabular-nums">
              {g.saved} of {g.target} · {g.percent}%{g.by ? ` · by ${g.by}` : ""}
            </span>
          </span>
          <IconChevronDown
            className={cn("size-[18px] shrink-0 text-(--sp-text-faint)", open && "rotate-180")}
            aria-hidden
          />
        </div>
      </div>
      <ProgressBar percent={g.percent} label={`${g.name}: ${g.percent}% saved`} />
      {open ? children : null}
    </li>
  );
}

function OpenBody() {
  return (
    <div className="flex flex-col gap-[14px] border-t border-(--sp-soft) pt-[14px]">
      <p className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text-muted)">$750.00 to go.</p>
      <div className="grid grid-cols-2 gap-[8px]">
        <SpButton variant="secondary">Add money</SpButton>
        <SpButton variant="secondary">Take out</SpButton>
      </div>
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[16px] pb-[24px]">
      <PageHeader back={{ href: "#", label: "Back to wallet" }} title="Goals" subtitle="Wallet" />
      <div className="flex flex-col gap-[12px]">
        <SpButton className="w-full" icon={<IconAdd aria-hidden />}>
          Add a goal
        </SpButton>
        {children}
      </div>
    </div>
  );
}

/** 1. The list: a grip on each title row. */
function GoalsList() {
  return (
    <Page>
      <ul className="flex flex-col gap-[12px]">
        <Card g={GOALS[0]} open>
          <OpenBody />
        </Card>
        <Card g={GOALS[1]} />
        <Card g={GOALS[2]} />
      </ul>
    </Page>
  );
}

/** 2. Dragging: "Rainy day fund" is lifted; the dashed box shows where it lands. */
function GoalsDragging() {
  return (
    <Page>
      <ul className="flex flex-col gap-[12px]">
        <li className="flex min-h-[108px] list-none items-center rounded-(--sp-radius) border-2 border-dashed border-(--sp-ring) bg-(--sp-soft) px-[14px] text-[0.75rem] font-medium text-(--sp-text-muted)">
          Drop here · place 1 of 3
        </li>
        <div className="-mt-[100px] ml-[8px] -mr-[4px] list-none">
          <Card g={GOALS[2]} lifted />
        </div>
        <Card g={GOALS[0]} />
        <Card g={GOALS[1]} />
      </ul>
    </Page>
  );
}

const LIVE: Goal[] = [
  { id: "g1", name: "New laptop", target: "1200.00", saved: "450.00", percent: 37, deadline: "2027-06-30", contributions: [] },
  { id: "g2", name: "Trip to Japan", target: "4000.00", saved: "1100.00", percent: 27, deadline: null, contributions: [] },
  { id: "g3", name: "Rainy day fund", target: "1000.00", saved: "300.00", percent: 30, deadline: "2026-12-31", contributions: [] },
];

/** 3. The real goals screen (component), fake data. Saving fails here (no server). */
function GoalsLive() {
  return (
    <PrefsProvider initialPrefs={DEFAULT_PREFERENCES} deviceZone="UTC">
      <div className="flex flex-col gap-[16px] pb-[24px]">
        <PageHeader back={{ href: "#", label: "Back to wallet" }} title="Goals" subtitle="Wallet" />
        <GoalsManager goals={LIVE} today="2026-11-14" available="500.00" />
      </div>
    </PrefsProvider>
  );
}

export const GOALS_MOCKS: Record<string, () => ReactNode> = {
  "goals-1-list": () => <GoalsList />,
  "goals-2-dragging": () => <GoalsDragging />,
  "goals-3-live": () => <GoalsLive />,
};
