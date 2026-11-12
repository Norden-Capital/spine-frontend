import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LUCIDE_TO_SP } from "@/components/spine-ui/icons";
import {
  AddPill,
  AlertRow,
  Avatar,
  BalanceCard,
  CardStack,
  FloatingDock,
  GreetingHeader,
  IconButton,
  ListItem,
  PeekCard,
  PinDots,
  ProgressBar,
  ProgressRing,
  QuickAction,
  QuickActions,
  SectionCard,
  SpButton,
  SpineLogo,
  TopBar,
  spineFont,
  type DockItem,
} from "@/components/spine-ui";
import "@/components/spine-ui/tokens.css";
import { ChipsDemo, PinDemo, SheetDemo } from "./demos";

// New icon set (iconsax Bulk), same names as the old Lucide imports.
const { Bell, CircleAlert, CircleCheck, ChartColumnBig, Receipt, TriangleAlert, Ellipsis, House, Lock, Plane, Plus, ScanLine, Search, ShoppingCart, User, Utensils, Wallet, Wifi } = LUCIDE_TO_SP;

// Design preview of the Spine UI kit (components/spine-ui), at /ui-kit.html.
// Dev only: 404 in production, not linked from the app. The dot in the path
// keeps it out of proxy.ts (no login needed); it shows only fake data.
// Each block forces its own theme with a .light / .dark wrapper, so light
// and dark show on one page whatever the user's setting.
// Layout = the reference (design/references/ui-reference-1.jpg), same sizes.

export const metadata: Metadata = {
  title: "UI kit",
  robots: { index: false, follow: false },
};

type Theme = "light" | "dark";
type Accent = "violet" | "navy" | "forest";

const EXPENSES = [
  { icon: <Utensils />, title: "Client Lunch", meta: "12:40 pm • 12 November, 2026", amount: "$186.40" },
  { icon: <Wifi />, title: "Internet Bill", meta: "09:00 am • 11 November, 2026", amount: "$55.00" },
  { icon: <ShoppingCart />, title: "Office Supplies", meta: "14:21 pm • 10 November, 2026", amount: "$78.00" },
  { icon: <Plane />, title: "Flight to Toronto", meta: "07:15 am • 9 November, 2026", amount: "$412.00" },
  { icon: <Wallet />, title: "Refund", meta: "16:02 pm • 8 November, 2026", amount: "+$320.00", income: true },
];

const DOCK: DockItem[] = [
  {
    href: "/ui-kit.html#home",
    label: "Home",
    icon: <House />,
    activeIcon: <House />,
    active: true,
  },
  { href: "/ui-kit.html#wallet", label: "Wallet", icon: <Wallet /> },
  { href: "/ui-kit.html#reports", label: "Reports", icon: <ChartColumnBig /> },
  { href: "/ui-kit.html#profile", label: "Profile", icon: <User /> },
];

function Themed({
  theme,
  accent,
  id,
  className,
  children,
}: {
  theme: Theme;
  accent?: Accent;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      data-sp-accent={accent}
      className={`${theme} ${spineFont.variable} sp sp-poppins bg-(--sp-bg) text-(--sp-text) ${className ?? ""}`}
      style={{ colorScheme: theme }}
    >
      {children}
    </div>
  );
}

function Stack({ className }: { className?: string }) {
  return (
    <CardStack
      className={className}
      back={<PeekCard label="Personal wallet" trailing={<Lock aria-hidden />} />}
      front={
        <BalanceCard
          tag="Company"
          amountLabel="This month"
          amount="$3,922.40"
          detail={{ label: "Expenses", value: "24" }}
          footer={{ label: "Name", value: "Sam Tremblay" }}
          action={<AddPill label="Expense" />}
        />
      }
    />
  );
}

function Actions({ className }: { className?: string }) {
  return (
    <QuickActions className={className}>
      <QuickAction label="Add" icon={<Plus />} />
      <QuickAction label="Scan" icon={<ScanLine />} />
      <QuickAction label="Search" icon={<Search />} />
      <QuickAction label="More" icon={<Ellipsis />} />
    </QuickActions>
  );
}

function Recent({ rows = EXPENSES.length, className }: { rows?: number; className?: string }) {
  return (
    <SectionCard className={className} title="Recent Expenses" action={{ label: "View All", href: "/ui-kit.html" }}>
      {EXPENSES.slice(0, rows).map((e) => (
        <ListItem
          key={e.title}
          icon={e.icon}
          title={e.title}
          meta={e.meta}
          amount={e.amount}
          tone={e.income ? "income" : "expense"}
        />
      ))}
    </SectionCard>
  );
}

/** A home screen, like one phone of the reference. Spacing in pt, measured. */
function HomeScreen({ theme }: { theme: Theme }) {
  return (
    <Themed
      theme={theme}
      id={`screen-${theme}`}
      className="relative mx-auto flex min-h-[812px] w-full max-w-[430px] flex-col px-(--sp-gutter) pt-[12px] pb-[9px]"
    >
      <TopBar
        right={
          <>
            <IconButton label="Notifications" icon={<Bell />} />
            <Avatar name="Sam Tremblay" />
          </>
        }
      />
      <GreetingHeader className="mt-[17.5px]" title="Hello Sam!" subtitle="Let's track your spending." />
      <Stack className="mt-[16.3px]" />
      <Actions className="mt-[25.4px]" />
      <Recent className="mt-[17.2px]" />
      {/* Sticky here (a preview with two screens); in the app the dock is position="fixed". */}
      <div className="pointer-events-none sticky bottom-(--sp-dock-gap) z-10 mt-[16px] flex justify-center">
        <FloatingDock position="static" items={DOCK} />
      </div>
    </Themed>
  );
}

function Part({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold tracking-wider text-(--sp-text-muted) uppercase">{name}</p>
      {children}
    </div>
  );
}

function Parts({ theme }: { theme: Theme }) {
  return (
    <Themed theme={theme} id={`parts-${theme}`} className="mx-auto w-full max-w-[430px] space-y-6 px-(--sp-gutter) py-8">
      <h2 className="text-lg font-semibold">Parts · {theme}</h2>
      <Part name="1 · Icon buttons (44)">
        <div className="flex items-center gap-3">
          <IconButton label="Notifications" icon={<Bell />} dot />
          <IconButton label="Search" icon={<Search />} variant="ink" />
          <IconButton label="Add" icon={<Plus />} variant="soft" size="lg" />
        </div>
      </Part>
      <Part name="2 · Avatar (44)">
        <Avatar name="Sam Tremblay" />
      </Part>
      <Part name="3 · Top bar">
        <TopBar
          right={
            <>
              <IconButton label="Notifications" icon={<Bell />} />
              <Avatar name="Sam Tremblay" />
            </>
          }
        />
      </Part>
      <Part name="4 · Greeting header">
        <GreetingHeader title="Hello Sam!" subtitle="Let's track your spending." />
      </Part>
      <Part name="5 · Balance card (no action)">
        <BalanceCard
          tag="Company"
          amountLabel="This month"
          amount="$3,922.40"
          detail={{ label: "Expenses", value: "24" }}
          footer={{ label: "Name", value: "Sam Tremblay" }}
        />
      </Part>
      <Part name="6 · Peek card (back card)">
        <PeekCard label="Personal wallet" trailing={<Lock aria-hidden />} />
      </Part>
      <Part name="7 · Card stack + add pill in the cut-out">
        <Stack />
      </Part>
      <Part name="8 · Add pill">
        <AddPill label="Expense" />
      </Part>
      <Part name="9 · Quick actions">
        <Actions />
      </Part>
      <Part name="10 · Section card + list items">
        <Recent rows={3} />
      </Part>
      <Part name="11 · Floating dock">
        <div className="flex flex-col items-center gap-3">
          <FloatingDock position="static" items={DOCK} />
          <FloatingDock position="static" items={DOCK.map((d, i) => ({ ...d, active: i === 1 }))} />
        </div>
      </Part>
      <Part name="Logo">
        <span className="flex size-[44px] items-center justify-center rounded-full bg-(--sp-panel)">
          <SpineLogo />
        </span>
      </Part>
    </Themed>
  );
}

/** Module 5 parts: PIN, progress, alerts, chips, buttons, bottom sheet. */
function Extras({ theme }: { theme: Theme }) {
  return (
    <Themed theme={theme} id={`extras-${theme}`} className="mx-auto w-full max-w-[430px] space-y-6 px-(--sp-gutter) py-8">
      <h2 className="text-lg font-semibold">More parts · {theme}</h2>
      <Part name="12 · PIN dots + keypad (wallet lock)">
        <PinDemo />
      </Part>
      <Part name="13 · Progress bars (budgets)">
        <SectionCard title="Budgets" action={{ label: "View All", href: "/ui-kit.html" }}>
          <div className="space-y-[18px] px-[14px] pt-[2px] pb-[10px]">
            <ProgressBar label="Travel" valueText="$420 of $600" value={0.7} />
            <ProgressBar label="Meals" valueText="$380 of $350" value={1.09} />
            <ProgressBar label="Office" valueText="$95 of $200" value={0.475} tone="ink" />
          </div>
        </SectionCard>
      </Part>
      <Part name="14 · Progress on a card + rings (goals)">
        <div className="rounded-(--sp-radius) bg-(--sp-card-front) px-[17px] py-[18px] text-(--sp-card-front-text)">
          <ProgressBar tone="onCard" label="Monthly budget" valueText="$3,922 of $5,000" value={0.78} />
        </div>
        <div className="mt-3 flex items-center justify-around rounded-(--sp-radius) bg-(--sp-panel) py-[18px]">
          <ProgressRing value={0.7} ariaLabel="Laptop goal 70%">70%</ProgressRing>
          <ProgressRing value={0.35} tone="success" ariaLabel="Trip goal 35%">35%</ProgressRing>
          <ProgressRing value={1.1} ariaLabel="Meals budget 110%">110%</ProgressRing>
          <ProgressRing value={0.5} size={48} thickness={6} tone="ink" ariaLabel="Half" />
        </div>
      </Part>
      <Part name="15 · Alert rows (notifications)">
        <SectionCard title="Alerts" action={{ label: "Mark all read", href: "/ui-kit.html" }}>
          <AlertRow icon={<TriangleAlert />} tone="warning" title="Meals budget almost used" message="You used 92% of the Meals budget for November." time="2h" unread />
          <AlertRow icon={<CircleAlert />} tone="danger" title="Receipt missing" message="Client Lunch, $186.40 needs a photo of the receipt." time="5h" unread />
          <AlertRow icon={<CircleCheck />} tone="success" title="Refund approved" message="$320.00 was added back." time="Yesterday" />
          <AlertRow icon={<Receipt />} tone="info" title="New expense added" message="Office Supplies, $78.00" time="10 Nov" />
        </SectionCard>
      </Part>
      <Part name="16 · Filter chips (scroll sideways)">
        <ChipsDemo />
      </Part>
      <Part name="17 · Buttons (52 / 44)">
        <div className="space-y-[10px]">
          <SpButton className="w-full">Save expense</SpButton>
          <SpButton className="w-full" variant="accent" icon={<Lock />}>Unlock wallet</SpButton>
          <div className="flex gap-[10px]">
            <SpButton variant="secondary" size="md">Cancel</SpButton>
            <SpButton variant="danger" size="md">Delete</SpButton>
          </div>
        </div>
      </Part>
      <Part name="18 · Bottom sheet">
        <SheetDemo />
      </Part>
      <Part name="19 · Card stack (several cards)">
        <CardStack
          back={[
            <PeekCard key="savings" tone="ink" label="Savings · $1,850.00" />,
          ]}
          front={
            <BalanceCard
              tag="Personal wallet"
              amountLabel="Wallet balance"
              amount="$2,486.15"
              detail={{ label: "This month", value: "-$612" }}
              footer={{ label: "Name", value: "Sam Tremblay" }}
              action={<AddPill label="Expense" />}
            />
          }
        />
      </Part>
      <Part name="20 · PIN dots, 6 digits">
        <PinDots length={6} filled={2} />
      </Part>
    </Themed>
  );
}

/** Optional colors (not the reference). Default = violet + sun. */
function Accents() {
  const sets: { accent: Accent; name: string }[] = [
    { accent: "violet", name: "Default · Violet + Sun (the reference)" },
    { accent: "navy", name: "Optional · Navy + Gold" },
    { accent: "forest", name: "Optional · Forest + Lime" },
  ];
  return (
    <div id="accents">
      {(["light", "dark"] as const).map((theme) => (
        <Themed
          key={theme}
          theme={theme}
          id={`accents-${theme}`}
          className="mx-auto w-full max-w-[430px] space-y-6 px-(--sp-gutter) py-8"
        >
          <h2 className="text-lg font-semibold">Colors · {theme}</h2>
          {sets.map((s) => (
            <div key={s.accent} data-sp-accent={s.accent}>
              <Part name={s.name}>
                <Stack />
              </Part>
            </div>
          ))}
        </Themed>
      ))}
    </div>
  );
}

export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="w-full bg-neutral-300">
      <HomeScreen theme="light" />
      <HomeScreen theme="dark" />
      <Parts theme="light" />
      <Parts theme="dark" />
      <Extras theme="light" />
      <Extras theme="dark" />
      <Accents />
    </main>
  );
}
