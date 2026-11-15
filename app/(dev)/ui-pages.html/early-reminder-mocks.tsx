"use client";

// Company repeats: early reminders — DESIGN MOCKS ONLY (dev). Fake data, "today" = Sun 15 Nov 2026.
// Each repeat has "Remind me before" (7 / 3 / 1 days, several allowed). Everyone also gets
// the alert on the due day. A repeat shows in Due soon from its first early reminder.

import type { ReactNode } from "react";
import {
  AlertRow,
  FilterChip,
  FilterChips,
  PageHeader,
  SectionCard,
  SpButton,
  SpField,
  SpInput,
  IconWarning,
} from "@/components/spine-ui";
import { OpenSheet } from "./client";
import { IconOffice } from "@/components/spine-ui";
import { DueSoonCard } from "@/components/recurring/due-soon-card";
import type { Occurrence } from "@/lib/recurring-types";

function Page({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-[16px] pb-[24px]">{children}</div>;
}

/** 1. The repeat form: a new "Remind me before" field. */
function RepeatForm() {
  return (
    <Page>
      <PageHeader back={{ href: "#", label: "Back" }} title="Repeat" subtitle="Company" />
      <OpenSheet title="Add a repeat expense" footer={<SpButton className="w-full">Save</SpButton>}>
        <div className="space-y-[16px]">
          <SpField label="Description" htmlFor="d">
            <SpInput id="d" defaultValue="Vercel" />
          </SpField>
          <SpField label="Amount" htmlFor="a">
            <SpInput id="a" defaultValue="$20.00" />
          </SpField>
          <SpField label="How often">
            <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[12px] text-[0.875rem]">Every month · from 14 Dec 2026</p>
          </SpField>
          <SpField label="Remind me before" hint="Everyone in the company gets these alerts, and one on the due day.">
            <FilterChips label="Remind me before" className="mx-0 px-0">
              <FilterChip label="7 days" active surface="panel" />
              <FilterChip label="3 days" active surface="panel" />
              <FilterChip label="1 day" surface="panel" />
            </FilterChips>
          </SpField>
        </div>
      </OpenSheet>
    </Page>
  );
}

/** 2. Dashboard: the real Due soon card, now with repeats due in the next days. */
const DUE = [
  { id: "o1", type: "EXPENSE", amount: "55.00", description: "Internet Bill", dueDate: "2026-11-15", status: "DUE", logoUrls: [], category: { id: "c1", name: "Internet", icon: "wifi", archived: false } },
  { id: "o2", type: "EXPENSE", amount: "20.00", description: "Vercel", dueDate: "2026-11-18", status: "DUE", logoUrls: [], category: { id: "c2", name: "Cloud & Hosting", icon: "cloud", archived: false } },
  { id: "o3", type: "EXPENSE", amount: "3.59", description: "Google Workspace", dueDate: "2026-11-22", status: "DUE", logoUrls: [], category: { id: "c3", name: "Productivity Apps", icon: "briefcase", archived: false } },
] as unknown as Occurrence[];

function DueSoon() {
  return (
    <Page>
      <PageHeader title="Home" subtitle="Company" />
      <DueSoonCard items={DUE} dates={{ dateFormat: "DD/MM/YYYY" }} today="2026-11-15" />
    </Page>
  );
}

/** 3. Alerts: early reminders, then the due-day alert. */
function Alerts() {
  const company = <IconOffice aria-hidden className="size-[12px]" />;
  return (
    <Page>
      <PageHeader title="Alerts" />
      <SectionCard title="Latest">
        <ul className="flex flex-col">
          <li>
            <AlertRow titleIcon={company} unread tone="warning" icon={<IconWarning aria-hidden />} title="Vercel is due in 3 days" message="$20.00 on Thu 18 Nov. Tap to add it." time="Today 8:00" href="#a" />
          </li>
          <li>
            <AlertRow titleIcon={company} unread tone="info" icon={<IconWarning aria-hidden />} title="Google Workspace is due in 7 days" message="$3.59 on Sun 22 Nov." time="Today 8:00" href="#b" />
          </li>
          <li>
            <AlertRow titleIcon={company} tone="danger" icon={<IconWarning aria-hidden />} title="Internet Bill is due today" message="$55.00 · Rogers. Tap to add it." time="Today 8:00" href="#c" />
          </li>
        </ul>
      </SectionCard>
    </Page>
  );
}

export const EARLY_REMINDER_MOCKS: Record<string, () => ReactNode> = {
  "early-1-form": () => <RepeatForm />,
  "early-2-due-soon": () => <DueSoon />,
  "early-3-alerts": () => <Alerts />,
};
