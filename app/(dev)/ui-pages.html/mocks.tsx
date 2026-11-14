"use client";

import { useState, type ReactNode } from "react";
import { CATEGORY_ICONS } from "@/components/expenses/category-icon";
import { CATEGORY_ICON_MAP } from "@/components/spine-ui/icons";
import { I, getIconSet, setIconSet } from "./icon-set";
import {
  Calendar,
  DateField,
  DueBadge,
  SwapStack,
  ActiveFilters,
  CategoryMultiGrid,
  DateRangePicker,
  PeriodBar,
  SearchBar,
  AddPill,
  BalanceCard,
  CardStack,
  GreetingHeader,
  PeekCard,
  ProgressBar,
  QuickAction,
  QuickActions,
  SectionCard,
  AmountField,
  DeviceCard,
  FontCards,
  IconTile,
  ProfileHero,
  SignInActivity,
  StatTiles,
  TextSizeControl,
  ThemeCards,
  AuthHeader,
  Avatar,
  CardSkeleton,
  CategoryGrid,
  ChoiceList,
  CommentThread,
  EmptyState,
  FilterChip,
  FilterChips,
  FloatingDock,
  IconButton,
  InfoList,
  ListItem,
  SpMoney,
  OrDivider,
  PageHeader,
  ProofTiles,
  RowGroup,
  RowIcon,
  SectionSkeleton,
  Segmented,
  SignInHeatmap,
  SpBadge,
  SpButton,
  SpField,
  SpInput,
  SpPanel,
  SpPasswordInput,
  SpRow,
  SpSkeleton,
  Timeline,
  TopBar,
  TxHero,
  type CategoryOption,
  type DockItem,
  type SignInDay,
} from "@/components/spine-ui";
import { OpenSheet } from "./client";
import { BALANCE_MOCKS } from "./balances-mocks";
import { NOTIFICATION_MOCKS } from "./notifications-mocks";
import { GOALS_MOCKS } from "./goals-mocks";
import { CURRENCY_MOCKS } from "./currency-mocks";

// Full-page mocks of the redesigned pages (dev only). Fake data.
// Each mock is the page content; the [mock] route wraps it in a themed frame.

/* ---------- shared bits ---------- */

type Tab = "home" | "expenses" | "wallet" | "settings" | "admin";

function dock(active: Tab): DockItem[] {
  const items: (DockItem & { key: Tab })[] = [
    { key: "home", href: "#home", label: "Home", icon: <I.House />, activeIcon: <I.House fill="currentColor" /> },
    { key: "expenses", href: "#expenses", label: "Expenses", icon: <I.ArrowLeftRight /> },
    { key: "wallet", href: "#wallet", label: "Wallet", icon: <I.Wallet /> },
    { key: "settings", href: "#settings", label: "Settings", icon: <I.Settings /> },
    { key: "admin", href: "#admin", label: "Admin", icon: <I.Shield /> },
  ];
  return items.map(({ key, ...i }) => ({ ...i, active: key === active }));
}

function AppTop() {
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

/** App page: top bar, content (16 apart), dock at the bottom. */
function AppPage({ tab, children }: { tab?: Tab; children: ReactNode }) {
  return (
    <>
      <AppTop />
      <div className="mt-[16px] space-y-[16px]">{children}</div>
      {tab ? (
        <div className="pointer-events-none sticky bottom-(--sp-dock-gap) z-10 mt-auto flex justify-center pt-[24px] pb-[9px]">
          <FloatingDock position="static" items={dock(tab)} />
        </div>
      ) : (
        <div className="h-[24px]" />
      )}
    </>
  );
}

/** Form page: no dock; the main button sits in a bar at the bottom (thumb zone). */
function FormPage({ children, bar }: { children: ReactNode; bar: ReactNode }) {
  return (
    <>
      <AppTop />
      <div className="mt-[16px] space-y-[16px] pb-[16px]">{children}</div>
      <div className="sticky bottom-0 z-10 -mx-(--sp-gutter) bg-linear-to-t from-(--sp-bg) from-70% to-transparent px-(--sp-gutter) pt-[20px] pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {bar}
      </div>
    </>
  );
}

function AuthPage({ children }: { children: ReactNode }) {
  return <div className="pt-[28px] pb-[32px]">{children}</div>;
}

const RECEIPT_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e9e4dc"/><rect x="28" y="12" width="64" height="100" rx="3" fill="#fff"/><g fill="#c9c3b9"><rect x="36" y="24" width="30" height="5" rx="2"/><rect x="36" y="38" width="48" height="3" rx="1.5"/><rect x="36" y="46" width="40" height="3" rx="1.5"/><rect x="36" y="54" width="44" height="3" rx="1.5"/><rect x="36" y="62" width="36" height="3" rx="1.5"/></g><rect x="36" y="80" width="48" height="2" fill="#d8d2c8"/><rect x="60" y="88" width="24" height="6" rx="2" fill="#9b40da"/></svg>`
  );

const COMPANY_CATS: CategoryOption[] = [
  { id: "bills", name: "Bills", icon: <I.Receipt /> },
  { id: "food", name: "Food", icon: <I.Utensils /> },
  { id: "office", name: "Office", icon: <I.Briefcase /> },
  { id: "software", name: "Software", icon: <I.Laptop /> },
  {
    id: "transport",
    name: "Transport",
    icon: <I.Car />,
    children: [
      { id: "taxi", name: "Taxi" },
      { id: "fuel", name: "Fuel" },
      { id: "parking", name: "Parking" },
    ],
  },
  { id: "travel", name: "Travel", icon: <I.Plane /> },
  { id: "internet", name: "Internet", icon: <I.Wifi /> },
  { id: "other", name: "Other", icon: <I.Ellipsis /> },
];

const WALLET_CATS: CategoryOption[] = [
  {
    id: "food",
    name: "Food",
    icon: <I.ShoppingBasket />,
    children: [
      { id: "groceries", name: "Groceries" },
      { id: "restaurants", name: "Restaurants" },
    ],
  },
  { id: "bills", name: "Bills", icon: <I.Receipt /> },
  { id: "transport", name: "Transport", icon: <I.Car /> },
  { id: "other", name: "Other", icon: <I.Ellipsis /> },
];

function heatmapDays(seed: number): SignInDay[] {
  const out: SignInDay[] = [];
  let x = seed;
  for (let i = 0; i < 26 * 7; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    const weekend = i % 7 >= 5;
    out.push(i > 26 * 7 - 3 ? "none" : r < (weekend ? 0.08 : 0.62) ? (r < 0.03 ? "failed" : "ok") : "none");
  }
  return out;
}
const MONTHS = [
  { label: "Jun", week: 0 },
  { label: "Jul", week: 4 },
  { label: "Aug", week: 9 },
  { label: "Sep", week: 13 },
  { label: "Oct", week: 17 },
  { label: "Nov", week: 22 },
];

/* ---------- transactions ---------- */

function TxDetail() {
  return (
    <AppPage tab="expenses">
      <PageHeader
        back={{ href: "#expenses", label: "Back to expenses" }}
        title="Expense"
        subtitle="Company"
        action={<IconButton label="More" icon={<I.Ellipsis />} variant="ghost" />}
      />
      <TxHero
        icon={<I.Receipt />}
        tag="Company"
        title="Hotel Rabat"
        meta="Bills · Hotels · Thu 12 Nov 2026"
        amount="-$120.00"
        kind="Expense"
      />
      <div className="grid grid-cols-3 gap-[8px]">
        <SpButton size="md" icon={<I.Pencil />}>
          Edit
        </SpButton>
        <SpButton size="md" variant="secondary" icon={<I.Copy />}>
          Copy
        </SpButton>
        <SpButton size="md" variant="danger" icon={<I.Trash2 />}>
          Delete
        </SpButton>
      </div>
      <InfoList
        rows={[
          { label: "Category", value: "Bills › Hotels" },
          { label: "Created", value: "Sam Tremblay · 12 Nov, 02:44" },
          { label: "Edited", value: "Adam Admin · 12 Nov, 09:10" },
        ]}
      />
      <SpPanel title="Proof" aside={<span className="text-[0.625rem] text-(--sp-text-faint)">2 files</span>}>
        <ProofTiles
          files={[
            { id: "1", name: "receipt.png", size: "122 KB", url: RECEIPT_IMG },
            { id: "2", name: "invoice-1123.pdf", size: "48 KB" },
          ]}
        />
      </SpPanel>
      <SpPanel title="Comments">
        <CommentThread
          comments={[
            { id: "1", author: "Adam Admin", time: "12 Nov, 09:12", text: "Is this the hotel for the client visit on Friday?" },
            { id: "2", author: "Sam Tremblay", time: "12 Nov, 09:40", text: "Yes, one night. The invoice is the PDF.", mine: true },
          ]}
          onDelete={() => {}}
          composer={{}}
        />
      </SpPanel>
      <SpPanel title="History">
        <Timeline
          entries={[
            {
              id: "3",
              title: "Edited by Adam Admin",
              meta: "12 Nov 2026, 09:10",
              changes: ["Category: Bills → Bills › Hotels", "Website: added hotelrabat.ma"],
              current: true,
            },
            { id: "2", title: "Proof added by Sam Tremblay", meta: "12 Nov 2026, 02:46", changes: ["invoice-1123.pdf"] },
            { id: "1", title: "Created by Sam Tremblay", meta: "12 Nov 2026, 02:44" },
          ]}
        />
      </SpPanel>
    </AppPage>
  );
}

function WalletTxDetail() {
  return (
    <AppPage tab="wallet">
      <PageHeader
        back={{ href: "#wallet", label: "Back to wallet" }}
        title="Wallet expense"
        subtitle="Only you can see this"
        action={<IconButton label="More" icon={<I.Ellipsis />} variant="ghost" />}
      />
      <TxHero
        tone="wallet"
        icon={<I.ShoppingBasket />}
        tag="Personal wallet"
        title="Groceries"
        meta="Food · Groceries · Wed 11 Nov 2026"
        amount="-$50.00"
        kind="Expense"
      />
      <div className="grid grid-cols-3 gap-[8px]">
        <SpButton size="md" icon={<I.Pencil />}>
          Edit
        </SpButton>
        <SpButton size="md" variant="secondary" icon={<I.Copy />}>
          Copy
        </SpButton>
        <SpButton size="md" variant="danger" icon={<I.Trash2 />}>
          Delete
        </SpButton>
      </div>
      <InfoList
        rows={[
          { label: "Category", value: "Food › Groceries" },
          { label: "Added", value: "11 Nov 2026, 18:20" },
        ]}
      />
      <SpPanel title="Proof" description="Optional for wallet expenses.">
        <ProofTiles files={[{ id: "1", name: "ticket.jpg", size: "96 KB", url: RECEIPT_IMG }]} />
      </SpPanel>
      <SpPanel title="History">
        <Timeline entries={[{ id: "1", title: "Added", meta: "11 Nov 2026, 18:20", current: true }]} />
      </SpPanel>
    </AppPage>
  );
}

function TxForm({ wallet, filled }: { wallet?: boolean; filled?: boolean }) {
  return (
    <>
      <PageHeader
        title={wallet ? (filled ? "Edit wallet expense" : "Add to wallet") : filled ? "Edit expense" : "New expense"}
        subtitle={wallet ? "Personal wallet · only you" : "Company"}
        action={<IconButton label="Close" icon={<I.X />} />}
      />
      <Segmented
        label="Type"
        value="expense"
        items={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />
      <AmountDemo initial={filled ? (wallet ? "50.00" : "120.00") : "120"} />
      <SpField label="Date" htmlFor="date">
        <SpInput id="date" type="date" defaultValue={wallet ? "2026-11-11" : "2026-11-12"} />
      </SpField>
      <SpField label="Description" htmlFor="desc">
        <SpInput
          id="desc"
          placeholder="e.g. Taxi to the client"
          defaultValue={filled ? (wallet ? "Groceries" : "Hotel Rabat") : "Hotel Rabat"}
        />
      </SpField>
      {wallet ? (
        <CategoryGrid options={WALLET_CATS} value="food" subValue="groceries" />
      ) : (
        <CategoryGrid options={COMPANY_CATS} value="transport" subValue="taxi" />
      )}
      <SpField
        label="Proof"
        optional={wallet}
        hint="A photo of the receipt, or a PDF."
      >
        <ProofTiles
          surface="page"
          onAdd={() => {}}
          onRemove={() => {}}
          files={wallet ? [] : [{ id: "1", name: "receipt.png", size: "122 KB", url: RECEIPT_IMG }]}
        />
      </SpField>
    </>
  );
}

function TxNew() {
  return (
    <FormPage bar={<SpButton className="w-full">Save expense</SpButton>}>
      <TxForm />
    </FormPage>
  );
}

function WalletTxEdit() {
  return (
    <FormPage
      bar={
        <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
          <SpButton variant="secondary">Cancel</SpButton>
          <SpButton>Save changes</SpButton>
        </div>
      }
    >
      <TxForm wallet filled />
    </FormPage>
  );
}

function TxDuplicate() {
  return (
    <>
      <FormPage bar={<SpButton className="w-full">Save expense</SpButton>}>
        <TxForm />
      </FormPage>
      <OpenSheet
        title="Already saved?"
        description="An expense with the same type, amount, currency and date already exists."
        footer={
          <div className="grid grid-cols-2 gap-[8px]">
            <SpButton variant="secondary">Cancel</SpButton>
            <SpButton>Save anyway</SpButton>
          </div>
        }
      >
        <div className="-mx-[14px]">
          <ListItem icon={<I.Receipt />} title="Hotel Rabat" meta="Sam Tremblay • 12 Nov 2026, 02:44" amount="$120.00" href="#tx" />
        </div>
      </OpenSheet>
    </>
  );
}

/* ---------- settings ---------- */

function SettingsTabs({ value }: { value: string }) {
  return (
    <Segmented
      label="Settings"
      value={value}
      items={[
        { value: "account", label: "Account", href: "#account" },
        { value: "security", label: "Security", href: "#security" },
        { value: "preferences", label: "Preferences", href: "#preferences" },
      ]}
    />
  );
}

function SettingsAccount() {
  return (
    <AppPage tab="settings">
      <PageHeader title="Settings" />
      <SettingsTabs value="account" />
      <SpPanel title="Your details">
        <div className="space-y-[14px]">
          <div className="grid grid-cols-2 gap-[10px]">
            <SpField label="First name" htmlFor="fn">
              <SpInput id="fn" surface="panel" defaultValue="Sam" autoComplete="given-name" />
            </SpField>
            <SpField label="Last name" htmlFor="ln">
              <SpInput id="ln" surface="panel" defaultValue="Tremblay" autoComplete="family-name" />
            </SpField>
          </div>
          <SpField label="Email" htmlFor="em" hint="Only an admin can change your email.">
            <SpInput id="em" surface="panel" icon={<I.Mail />} readOnly defaultValue="sam.tremblay@nordencapital.ca" />
          </SpField>
          <SpButton className="w-full" disabled>
            Save
          </SpButton>
        </div>
      </SpPanel>
      <InfoList
        title="Account"
        rows={[
          { label: "Role", value: <SpBadge tone="accent">Admin</SpBadge> },
          { label: "Status", value: <SpBadge tone="success">Active</SpBadge> },
          { label: "Created", value: "2 Sep 2026" },
          { label: "Last login", value: "Today, 08:12" },
        ]}
      />
      <SignInHeatmap days={heatmapDays(7)} months={MONTHS} summary="98 days · 3 failed tries" />
      <SpButton className="w-full" variant="danger" icon={<I.LogOut />}>
        Log out
      </SpButton>
    </AppPage>
  );
}

function SettingsSecurity() {
  return (
    <AppPage tab="settings">
      <PageHeader title="Settings" />
      <SettingsTabs value="security" />
      <SpPanel title="Change password" description="You stay logged in here. Your other devices are logged out.">
        <div className="space-y-[14px]">
          <SpField label="Current password" htmlFor="cp">
            <SpPasswordInput id="cp" surface="panel" placeholder="Your current password" autoComplete="current-password" />
          </SpField>
          <SpField label="New password" htmlFor="np" hint="At least 12 characters.">
            <SpPasswordInput id="np" surface="panel" placeholder="At least 12 characters" autoComplete="new-password" />
          </SpField>
          <SpField label="Repeat new password" htmlFor="rp">
            <SpPasswordInput id="rp" surface="panel" placeholder="Repeat the password" autoComplete="new-password" />
          </SpField>
          <SpButton className="w-full">Change password</SpButton>
        </div>
      </SpPanel>
      <RowGroup title="Face ID & fingerprint">
        <p className="px-[14px] pb-[6px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
          Log in without your password on these devices.
        </p>
        <SpRow
          leading={<RowIcon><I.Smartphone /></RowIcon>}
          title="iPhone 15"
          subtitle="Added 2 Nov · Used today"
          trailing={<IconButton label="Options for iPhone 15" icon={<I.Ellipsis />} variant="ghost" />}
        />
        <SpRow
          leading={<RowIcon><I.Laptop /></RowIcon>}
          title="MacBook Air"
          subtitle="Added 14 Oct · Used 3 days ago"
          trailing={<IconButton label="Options for MacBook Air" icon={<I.Ellipsis />} variant="ghost" />}
        />
        <SpRow
          leading={<RowIcon tone="ink"><I.Plus /></RowIcon>}
          title="Add Face ID / fingerprint"
          subtitle="Give it a name, then confirm with your face or finger."
          onClick={() => {}}
          trailing={<span />}
        />
      </RowGroup>
    </AppPage>
  );
}

function SettingsPreferences() {
  return (
    <AppPage tab="settings">
      <PageHeader title="Settings" />
      <SettingsTabs value="preferences" />
      <SpPanel title="Look" description="Changes show right away and are saved.">
        <div className="space-y-[18px]">
          <SpField label="Theme" hint="Auto follows your phone (light or dark).">
            <Segmented
              label="Theme"
              surface="panel"
              value="auto"
              items={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "auto", label: "Auto" },
              ]}
            />
          </SpField>
          <SpField label="Text size">
            <Segmented
              label="Text size"
              surface="panel"
              value="normal"
              items={[
                { value: "small", label: "Small" },
                { value: "normal", label: "Normal" },
                { value: "large", label: "Large" },
              ]}
            />
          </SpField>
          <SpField label="Font">
            <ChoiceList
              label="Font"
              value="poppins"
              options={[
                { value: "poppins", label: "Poppins", hint: "Default" },
                { value: "inter", label: "Inter" },
                { value: "manrope", label: "Manrope" },
                { value: "system", label: "System", hint: "The font of your phone" },
              ]}
            />
          </SpField>
        </div>
      </SpPanel>
      <SpPanel title="Dates and time">
        <div className="space-y-[18px]">
          <SpField label="Date format">
            <Segmented
              label="Date format"
              surface="panel"
              value="dmy"
              items={[
                { value: "dmy", label: "31/12" },
                { value: "mdy", label: "12/31" },
                { value: "iso", label: "2026-12-31" },
              ]}
            />
          </SpField>
          <SpField label="Time zone">
            <SpRow
              className="bg-(--sp-soft) pl-[16px]"
              title="Follow my phone"
              subtitle="Now: America/Toronto (UTC−5)"
              href="#tz"
            />
          </SpField>
        </div>
      </SpPanel>
    </AppPage>
  );
}

function LogoutSheet() {
  return (
    <>
      <SettingsAccount />
      <OpenSheet
        title="Log out?"
        description="You will need to log in again on this phone."
        footer={
          <div className="space-y-[8px]">
            <SpButton className="w-full" variant="danger" icon={<I.LogOut />}>
              Log out
            </SpButton>
            <SpButton className="w-full" variant="secondary">
              Cancel
            </SpButton>
          </div>
        }
      >
        <span />
      </OpenSheet>
    </>
  );
}

/* ---------- admin ---------- */

function AdminTabs({ value }: { value: string }) {
  return (
    <Segmented
      label="Admin"
      value={value}
      items={[
        { value: "users", label: "Users", href: "#users" },
        { value: "categories", label: "Categories", href: "#categories" },
        { value: "trash", label: "Trash", href: "#trash" },
      ]}
    />
  );
}

function initialsIcon(name: string) {
  const p = name.split(" ");
  return <span className="text-[0.6875rem] font-medium">{(p[0][0] + (p[1]?.[0] ?? "")).toUpperCase()}</span>;
}

function AdminUsers() {
  const users = [
    { name: "Adam Admin", email: "adam@nordencapital.ca", role: "Owner", status: "Active", tone: "accent" as const },
    { name: "Sam Tremblay", email: "sam.tremblay@nordencapital.ca", role: "Admin", status: "Active", tone: "accent" as const },
    { name: "Emma Employee", email: "emma@nordencapital.ca", role: "Employee", status: "Active" },
    { name: "Karim Benali", email: "karim@nordencapital.ca", role: "Employee", status: "Invited" },
    { name: "Léa Roy", email: "lea.roy@nordencapital.ca", role: "Employee", status: "Disabled" },
  ];
  return (
    <AppPage tab="admin">
      <PageHeader title="Admin" />
      <AdminTabs value="users" />
      <div className="flex gap-[8px]">
        <div className="min-w-0 flex-1">
          <SpInput icon={<I.Search />} placeholder="Search users" aria-label="Search users by name or email" />
        </div>
        <SpButton icon={<I.UserPlus />} className="px-[18px]">
          Invite
        </SpButton>
      </div>
      <FilterChips label="Filter users">
        <FilterChip label="All" count={5} active />
        <FilterChip label="Admins" count={2} />
        <FilterChip label="Employees" count={3} />
        <FilterChip label="Invited" count={1} />
      </FilterChips>
      <RowGroup>
        {users.map((u) => (
          <SpRow
            key={u.email}
            href="#user"
            leading={
              <span
                className={
                  "flex size-[33px] shrink-0 items-center justify-center rounded-full " +
                  (u.status === "Disabled"
                    ? "bg-(--sp-soft) text-(--sp-text-muted)"
                    : "bg-(--sp-chip-active) text-(--sp-chip-active-text)")
                }
              >
                {initialsIcon(u.name)}
              </span>
            }
            title={u.name}
            subtitle={u.email}
            muted={u.status === "Disabled"}
            trailing={
              <span className="flex shrink-0 flex-col items-end gap-[4px]">
                <SpBadge tone={u.tone ?? "neutral"}>{u.role}</SpBadge>
                {u.status !== "Active" ? (
                  <SpBadge tone={u.status === "Invited" ? "warning" : "neutral"}>{u.status}</SpBadge>
                ) : null}
              </span>
            }
          />
        ))}
      </RowGroup>
    </AppPage>
  );
}

function AdminUserDetail() {
  return (
    <AppPage tab="admin">
      <PageHeader
        back={{ href: "#users", label: "Back to users" }}
        title="Emma Employee"
        subtitle="emma@nordencapital.ca"
        action={<IconButton label="More" icon={<I.Ellipsis />} variant="ghost" />}
      />
      <div className="flex gap-[6px] px-[2px]">
        <SpBadge>Employee</SpBadge>
        <SpBadge tone="success">Active</SpBadge>
      </div>
      <InfoList
        rows={[
          { label: "Email", value: "emma@nordencapital.ca" },
          { label: "Role", value: "Employee" },
          { label: "Created", value: "12 Nov 2026" },
          { label: "Last login", value: "Never" },
        ]}
      />
      <SignInHeatmap days={Array.from({ length: 26 * 7 }, () => "none" as const)} months={MONTHS} summary="0 days · 0 failed tries" />
      <RowGroup title="Manage">
        <SpRow leading={<RowIcon><I.Mail /></RowIcon>} title="Send the invite again" subtitle="Emma has not logged in yet." onClick={() => {}} trailing={<span />} />
        <SpRow leading={<RowIcon><I.LogOut /></RowIcon>} title="Log out on all devices" onClick={() => {}} trailing={<span />} />
        <SpRow
          leading={
            <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sp-danger)_14%,var(--sp-panel))] text-(--sp-danger) [&_svg]:size-[15px] [&_svg]:stroke-[1.7]">
              <I.X />
            </span>
          }
          title={<span className="text-(--sp-danger)">Disable this user</span>}
          subtitle="She can no longer log in. You can undo it."
          onClick={() => {}}
          trailing={<span />}
        />
      </RowGroup>
    </AppPage>
  );
}

function AdminTrash() {
  const items = [
    { title: "Lunch meeting", sub: "Deleted by Adam Admin · 12 Nov", amount: "-$18.50", icon: <I.Utensils /> },
    { title: "Taxi to the airport", sub: "Deleted by Sam Tremblay · 10 Nov", amount: "-$54.20", icon: <I.Car /> },
    { title: "Printer paper", sub: "Deleted by Emma Employee · 3 Nov", amount: "-$12.00", icon: <I.FileText /> },
  ];
  return (
    <AppPage tab="admin">
      <PageHeader title="Admin" />
      <AdminTabs value="trash" />
      <RowGroup title="Trash" aside={<span className="text-[0.625rem] text-(--sp-text-faint)">3 expenses</span>}>
        {items.map((t) => (
          <SpRow
            key={t.title}
            leading={<RowIcon>{t.icon}</RowIcon>}
            title={t.title}
            subtitle={t.sub}
            trailing={
              <span className="flex shrink-0 items-center gap-[2px]">
                <span className="text-[0.8125rem] font-semibold text-(--sp-text) tabular-nums">{t.amount}</span>
                <IconButton label={`Restore ${t.title}`} icon={<I.RotateCcw />} variant="ghost" />
              </span>
            }
          />
        ))}
      </RowGroup>
      <p className="px-[14px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
        Restore puts the expense back in the list, with its proof and history.
      </p>
    </AppPage>
  );
}

function AdminCategories() {
  const more = (n: string) => <IconButton label={`Options for ${n}`} icon={<I.Ellipsis />} variant="ghost" />;
  return (
    <AppPage tab="admin">
      <PageHeader title="Admin" />
      <AdminTabs value="categories" />
      <SpButton className="w-full" icon={<I.Plus />}>
        Add category
      </SpButton>
      <RowGroup>
        <SpRow leading={<RowIcon><I.Receipt /></RowIcon>} title="Bills" subtitle="1 subcategory" trailing={more("Bills")} />
        <SpRow indent leading={<RowIcon><I.Receipt /></RowIcon>} title="Hotels" trailing={more("Hotels")} />
        <SpRow leading={<RowIcon><I.Utensils /></RowIcon>} title="Food" trailing={more("Food")} />
        <SpRow leading={<RowIcon><I.Briefcase /></RowIcon>} title="Office" trailing={more("Office")} />
        <SpRow leading={<RowIcon><I.Laptop /></RowIcon>} title="Software" trailing={more("Software")} />
        <SpRow leading={<RowIcon><I.Car /></RowIcon>} title="Transport" subtitle="3 subcategories" trailing={more("Transport")} />
        <SpRow indent leading={<RowIcon><I.Car /></RowIcon>} title="Taxi" trailing={more("Taxi")} />
        <SpRow indent leading={<RowIcon><I.Car /></RowIcon>} title="Fuel" trailing={more("Fuel")} />
        <SpRow indent leading={<RowIcon><I.Car /></RowIcon>} title="Parking" trailing={more("Parking")} />
        <SpRow leading={<RowIcon><I.Plane /></RowIcon>} title="Travel" trailing={more("Travel")} />
        <SpRow leading={<RowIcon><I.Ellipsis /></RowIcon>} title="Other" trailing={more("Other")} />
      </RowGroup>
      <RowGroup>
        <SpRow
          onClick={() => {}}
          leading={<RowIcon><I.Wifi /></RowIcon>}
          title="Archived"
          subtitle="1 category · Internet"
          muted
          trailing={<I.ChevronDown aria-hidden className="mr-[12px] size-[18px] stroke-[1.8] text-(--sp-text-faint)" />}
        />
      </RowGroup>
    </AppPage>
  );
}

/* ---------- auth ---------- */

function Login() {
  return (
    <AuthPage>
      <AuthHeader title="Welcome back" subtitle="Log in with the email your admin invited." />
      <div className="mt-[32px] space-y-[16px]">
        <SpField label="Email" htmlFor="le">
          <SpInput id="le" type="email" placeholder="name@nordencapital.ca" autoComplete="email" icon={<I.Mail />} />
        </SpField>
        <SpField
          label="Password"
          htmlFor="lp"
          aside={
            <a href="#forgot" className="text-[0.6875rem] font-medium text-(--sp-card-front)">
              Forgot?
            </a>
          }
        >
          <SpPasswordInput id="lp" placeholder="Your password" autoComplete="current-password" />
        </SpField>
        <SpButton className="mt-[8px] w-full">Log in</SpButton>
        <OrDivider />
        <SpButton className="w-full" variant="secondary" icon={<I.ScanFace />}>
          Log in with Face ID
        </SpButton>
      </div>
      <p className="mt-[32px] text-center text-[0.6875rem] leading-snug text-(--sp-text-muted)">
        No account? Ask your admin for an invite.
      </p>
    </AuthPage>
  );
}

function ForgotPassword() {
  return (
    <AuthPage>
      <AuthHeader title="Forgot password?" subtitle="We email you a link to choose a new password." />
      <div className="mt-[32px] space-y-[16px]">
        <SpField label="Email" htmlFor="fe">
          <SpInput id="fe" type="email" placeholder="name@nordencapital.ca" autoComplete="email" icon={<I.Mail />} />
        </SpField>
        <SpButton className="mt-[8px] w-full">Send link</SpButton>
        <SpButton className="w-full" variant="secondary">
          Back to log in
        </SpButton>
      </div>
    </AuthPage>
  );
}

function SetPassword() {
  return (
    <AuthPage>
      <AuthHeader title="Choose a password" subtitle="For emma@nordencapital.ca. You use it to log in to Spine." />
      <div className="mt-[32px] space-y-[16px]">
        <SpField label="New password" htmlFor="sp1" hint="At least 12 characters.">
          <SpPasswordInput id="sp1" placeholder="At least 12 characters" autoComplete="new-password" />
        </SpField>
        <SpField label="Repeat the password" htmlFor="sp2">
          <SpPasswordInput id="sp2" placeholder="Repeat the password" autoComplete="new-password" />
        </SpField>
        <SpButton className="mt-[8px] w-full">Save password</SpButton>
      </div>
    </AuthPage>
  );
}

function LinkExpired() {
  return (
    <AuthPage>
      <AuthHeader title="This link does not work" subtitle="It has expired or was already used." />
      <EmptyState
        className="mt-[24px]"
        framed
        tone="danger"
        icon={<I.Mail />}
        title="Ask for a new link"
        text="Ask your admin for a new invite, or request a new reset link."
        action={<SpButton>Get a new reset link</SpButton>}
      />
      <SpButton className="mt-[12px] w-full" variant="secondary">
        Back to log in
      </SpButton>
    </AuthPage>
  );
}

/* ---------- states ---------- */

function StateEmpty() {
  return (
    <AppPage tab="expenses">
      <PageHeader title="Expenses" subtitle="Company · November 2026" />
      <SpInput icon={<I.Search />} placeholder="Search expenses" aria-label="Search expenses" />
      <FilterChips label="Filter expenses">
        <FilterChip label="All" count={0} active />
        <FilterChip label="This month" />
        <FilterChip label="Travel" />
        <FilterChip label="Meals" />
      </FilterChips>
      <EmptyState
        framed
        icon={<I.Receipt />}
        title="No expenses yet"
        text="Add your first expense. Take a photo of the receipt and you are done."
        action={<SpButton icon={<I.Plus />}>Add expense</SpButton>}
      />
      <EmptyState
        icon={<I.SearchX />}
        title="No results for “hotel”"
        text="Check the spelling or clear the filters."
        action={
          <SpButton size="md" variant="secondary">
            Clear filters
          </SpButton>
        }
      />
    </AppPage>
  );
}

function StateLoading() {
  return (
    <AppPage tab="home">
      <div className="space-y-[10px] pt-[6px]">
        <SpSkeleton className="h-[26px] w-[180px]" />
        <SpSkeleton className="h-[10px] w-[150px]" />
      </div>
      <div>
        <div className="h-[51px] rounded-t-(--sp-radius) bg-[color-mix(in_oklab,var(--sp-text)_5%,transparent)]" />
        <CardSkeleton className="-mt-[29px]" />
      </div>
      <div className="flex h-[112px] items-center justify-around rounded-(--sp-radius) bg-(--sp-panel)">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="flex flex-col items-center gap-[12px]">
            <SpSkeleton className="size-[48px]" />
            <SpSkeleton className="h-[8px] w-[36px]" />
          </span>
        ))}
      </div>
      <SectionSkeleton rows={4} />
    </AppPage>
  );
}

function StateError() {
  return (
    <AppPage tab="home">
      <EmptyState
        className="pt-[64px]"
        tone="danger"
        icon={<I.CloudOff />}
        title="Something went wrong"
        text="We could not load this page. Check your connection and try again."
        action={
          <>
            <SpButton icon={<I.RotateCcw />}>Try again</SpButton>
            <SpButton variant="secondary">Go home</SpButton>
          </>
        }
      />
    </AppPage>
  );
}

function StateNotFound() {
  return (
    <AppPage tab="home">
      <EmptyState
        className="pt-[56px]"
        code="404"
        title="Page not found"
        text="This page does not exist, or the expense was deleted."
        action={
          <>
            <SpButton icon={<I.House />}>Go home</SpButton>
            <SpButton variant="secondary">See expenses</SpButton>
          </>
        }
      />
    </AppPage>
  );
}

/* ---------- settings v2 (more presentable) ---------- */

const PROFILE = { name: "Sam Tremblay", email: "sam.tremblay@nordencapital.ca", role: "Admin" };

function Stats() {
  return (
    <StatTiles
      items={[
        { icon: <I.LogIn />, tone: "violet", value: "18", label: "Sign-ins this month" },
        { icon: <I.Clock />, tone: "sun", value: "Today", label: "Last login, 08:12" },
        { icon: <I.ScanFace />, tone: "ink", value: "2", label: "Face ID devices" },
      ]}
    />
  );
}

function SettingsHub() {
  return (
    <AppPage tab="settings">
      <PageHeader title="Settings" />
      <ProfileHero {...PROFILE} status="Active" since="Member since Sep 2026" />
      <Stats />
      <RowGroup>
        <SpRow
          href="#account"
          leading={<IconTile tone="violet" size={44}><I.User /></IconTile>}
          title="My account"
          subtitle="Name, email, role, sign-ins"
        />
        <SpRow
          href="#security"
          leading={<IconTile tone="ink" size={44}><I.Lock /></IconTile>}
          title="Security"
          subtitle="Password, Face ID / fingerprint"
        />
        <SpRow
          href="#preferences"
          leading={<IconTile tone="sun" size={44}><I.Palette /></IconTile>}
          title="Preferences"
          subtitle="Theme, text size, font, dates"
        />
      </RowGroup>
      <SpButton className="w-full" variant="danger" icon={<I.LogOut />}>
        Log out
      </SpButton>
    </AppPage>
  );
}

function SettingsAccountV2() {
  return (
    <AppPage tab="settings">
      <PageHeader back={{ href: "#settings", label: "Back to settings" }} title="My account" />
      <ProfileHero {...PROFILE} status="Active" since="Member since Sep 2026" />
      <Stats />
      <SpPanel title="Your details" description="Your name shows on your expenses and comments.">
        <div className="space-y-[14px]">
          <div className="grid grid-cols-2 gap-[10px]">
            <SpField label="First name" htmlFor="fn2">
              <SpInput id="fn2" surface="panel" defaultValue="Sam" autoComplete="given-name" />
            </SpField>
            <SpField label="Last name" htmlFor="ln2">
              <SpInput id="ln2" surface="panel" defaultValue="Tremblay" autoComplete="family-name" />
            </SpField>
          </div>
          <SpField label="Email" htmlFor="em2" hint="Only an admin can change your email.">
            <SpInput id="em2" surface="panel" icon={<I.Lock />} readOnly defaultValue={PROFILE.email} />
          </SpField>
          <SpButton className="w-full" disabled>
            Save
          </SpButton>
        </div>
      </SpPanel>
      <RowGroup title="Account">
        <SpRow
          leading={<IconTile tone="violet"><I.Shield /></IconTile>}
          title="Role"
          trailing={<SpBadge tone="accent">Admin</SpBadge>}
          className="pr-[14px]"
        />
        <SpRow
          leading={<IconTile tone="green"><I.CircleCheck /></IconTile>}
          title="Status"
          trailing={<SpBadge tone="success">Active</SpBadge>}
          className="pr-[14px]"
        />
        <SpRow
          leading={<IconTile tone="sun"><I.CalendarDays /></IconTile>}
          title="Created"
          trailing={<span className="text-[0.75rem] font-medium text-(--sp-text)">2 Sep 2026</span>}
          className="pr-[14px]"
        />
        <SpRow
          leading={<IconTile tone="ink"><I.Clock /></IconTile>}
          title="Last login"
          trailing={<span className="text-[0.75rem] font-medium text-(--sp-text)">Today, 08:12</span>}
          className="pr-[14px]"
        />
      </RowGroup>
      <SignInActivity days={heatmapDays(7)} months={MONTHS} total={98} totalLabel="days with a sign-in" failed={3} />
    </AppPage>
  );
}

function SettingsSecurityV2() {
  return (
    <AppPage tab="settings">
      <PageHeader back={{ href: "#settings", label: "Back to settings" }} title="Security" />
      <section className="rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[16px] pb-[16px]">
        <div className="flex items-start gap-[12px]">
          <IconTile tone="violet" size={52}>
            <I.KeyRound />
          </IconTile>
          <div className="min-w-0 flex-1 pt-[4px] leading-tight">
            <h2 className="text-[0.9375rem] font-medium text-(--sp-text)">Password</h2>
            <p className="mt-[5px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
              At least 12 characters. When you change it, your other devices are logged out.
            </p>
          </div>
        </div>
        <SpButton className="mt-[16px] w-full" variant="secondary" icon={<I.KeyRound />}>
          Change password
        </SpButton>
      </section>
      <section className="rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[16px] pb-[16px]">
        <div className="flex items-start gap-[12px]">
          <IconTile tone="ink" size={52}>
            <I.ScanFace />
          </IconTile>
          <div className="min-w-0 flex-1 pt-[4px] leading-tight">
            <h2 className="text-[0.9375rem] font-medium text-(--sp-text)">Face ID &amp; fingerprint</h2>
            <p className="mt-[5px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
              Log in without your password on these devices.
            </p>
          </div>
        </div>
        <div className="mt-[16px] space-y-[10px]">
          <DeviceCard
            icon={<I.Smartphone />}
            tone="violet"
            name="iPhone 15"
            added="2 Nov 2026"
            lastUsed="Today, 08:12"
            current
            action={<IconButton label="Options for iPhone 15" icon={<I.Ellipsis />} variant="ghost" />}
          />
          <DeviceCard
            icon={<I.Laptop />}
            tone="sun"
            name="MacBook Air"
            added="14 Oct 2026"
            lastUsed="3 days ago"
            action={<IconButton label="Options for MacBook Air" icon={<I.Ellipsis />} variant="ghost" />}
          />
        </div>
        <SpButton className="mt-[14px] w-full" icon={<I.Fingerprint />}>
          Add Face ID / fingerprint
        </SpButton>
        <p className="mt-[10px] text-center text-[0.625rem] leading-snug text-(--sp-text-faint)">
          Give it a name, then confirm with your face or finger.
        </p>
      </section>
    </AppPage>
  );
}

function SettingsPasswordSheet() {
  return (
    <>
      <SettingsSecurityV2 />
      <OpenSheet
        title="Change password"
        description="You stay logged in here. Your other devices are logged out."
        footer={<SpButton className="w-full">Change password</SpButton>}
      >
        <div className="space-y-[14px]">
          <SpField label="Current password" htmlFor="cp2">
            <SpPasswordInput id="cp2" surface="panel" placeholder="Your current password" autoComplete="current-password" />
          </SpField>
          <SpField label="New password" htmlFor="np2" hint="At least 12 characters.">
            <SpPasswordInput id="np2" surface="panel" placeholder="At least 12 characters" autoComplete="new-password" />
          </SpField>
          <SpField label="Repeat new password" htmlFor="rp2">
            <SpPasswordInput id="rp2" surface="panel" placeholder="Repeat the password" autoComplete="new-password" />
          </SpField>
        </div>
      </OpenSheet>
    </>
  );
}

function SettingsPreferencesV2() {
  return (
    <AppPage tab="settings">
      <PageHeader
        back={{ href: "#settings", label: "Back to settings" }}
        title="Preferences"
        subtitle="Changes show right away and are saved."
      />
      <SpPanel title="Theme" description="Auto follows your phone (light or dark).">
        <ThemeCards value="auto" />
      </SpPanel>
      <SpPanel title="Text size">
        <TextSizeControl value="normal" />
      </SpPanel>
      <SpPanel title="Font">
        <FontCards
          value="poppins"
          options={[
            { value: "poppins", label: "Poppins", hint: "Default", family: "var(--font-poppins)" },
            { value: "inter", label: "Inter", family: "var(--font-inter)" },
            { value: "manrope", label: "Manrope", family: "var(--font-manrope)" },
            { value: "system", label: "System", family: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
          ]}
        />
      </SpPanel>
      <SpPanel title="Dates and time">
        <div className="rounded-[16px] bg-(--sp-card-front) px-[14px] py-[14px] text-(--sp-card-front-text)">
          <p className="-my-[0.25em] text-[0.625rem] leading-[1.5] text-(--sp-card-front-muted)">Today looks like this</p>
          <p className="mt-[calc(8px-0.25em)] -mb-[0.25em] text-[1.25rem] leading-[1.5] font-medium tabular-nums">12/11/2026 · 14:05</p>
          <p className="mt-[calc(6px-0.25em)] -mb-[0.25em] text-[0.6875rem] leading-[1.5] text-(--sp-card-front-muted)">America/Toronto (UTC−5)</p>
        </div>
        <div className="mt-[16px] space-y-[16px]">
          <SpField label="Date format">
            <Segmented
              label="Date format"
              surface="panel"
              value="dmy"
              items={[
                { value: "dmy", label: "12/11" },
                { value: "mdy", label: "11/12" },
                { value: "iso", label: "2026-11-12" },
              ]}
            />
          </SpField>
          <SpField label="Time zone">
            <SpRow
              className="bg-(--sp-soft) pl-[12px]"
              leading={
                <IconTile tone="sun">
                  <I.Clock />
                </IconTile>
              }
              title="Follow my phone"
              subtitle="Now: America/Toronto (UTC−5)"
              href="#tz"
            />
          </SpField>
        </div>
      </SpPanel>
    </AppPage>
  );
}

/* ---------- home + wallet (icon before/after) ---------- */

function HomeMock() {
  return (
    <AppPage tab="home">
      <GreetingHeader title="Hello Sam!" subtitle="Let's track your spending." />
      <CardStack
        back={<PeekCard label="Personal wallet" trailing={<I.Lock />} />}
        front={
          <BalanceCard
            tag="Company"
            amountLabel="This month"
            amount="$3,922.40"
            detail={{ label: "Expenses", value: "24" }}
            footer={{ label: "Name", value: "Sam Tremblay" }}
            action={<AddPill label="Expense" icon={<I.Plus className="size-[16px]" />} />}
          />
        }
      />
      <QuickActions>
        <QuickAction label="Add" icon={<I.Plus />} />
        <QuickAction label="Scan" icon={<I.ScanLine />} />
        <QuickAction label="Search" icon={<I.Search />} />
        <QuickAction label="More" icon={<I.Ellipsis />} />
      </QuickActions>
      <SectionCard title="Recent Expenses" action={{ label: "View All", href: "#expenses" }}>
        <ListItem icon={<I.Utensils />} title="Client Lunch" meta="12:40 pm • 12 November, 2026" amount="$186.40" href="#tx" />
        <ListItem icon={<I.Wifi />} title="Internet Bill" meta="09:00 am • 11 November, 2026" amount="$55.00" href="#tx" />
        <ListItem icon={<I.TrainFront />} title="Train to Montréal" meta="07:15 am • 10 November, 2026" amount="$84.00" href="#tx" />
        <ListItem icon={<I.Hotel />} title="Hotel Rabat" meta="02:44 am • 9 November, 2026" amount="$120.00" href="#tx" />
      </SectionCard>
    </AppPage>
  );
}

function WalletMock() {
  return (
    <AppPage tab="wallet">
      <PageHeader title="Wallet" subtitle="Personal · only you" action={<IconButton label="Lock wallet" icon={<I.Lock />} />} />
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
            action={<AddPill label="Expense" icon={<I.Plus className="size-[16px]" />} />}
          />
        }
      />
      <QuickActions>
        <QuickAction label="Budgets" icon={<I.PiggyBank />} />
        <QuickAction label="Goals" icon={<I.Target />} />
        <QuickAction label="Recurring" icon={<I.Repeat />} />
        <QuickAction label="Categories" icon={<I.Shapes />} />
      </QuickActions>
      <SpPanel title="Budgets" aside={<span className="text-[0.625rem] text-(--sp-text-faint)">November</span>}>
        <div className="space-y-[16px]">
          <ProgressBar label="Food" valueText="$420 of $600" value={0.7} />
          <ProgressBar label="Transport" valueText="$95 of $200" value={0.475} tone="ink" />
        </div>
      </SpPanel>
      <SectionCard title="Recent" action={{ label: "View All", href: "#wallet" }}>
        <ListItem icon={<I.ShoppingCart />} title="Groceries" meta="18:20 pm • 11 November, 2026" amount="$50.00" href="#tx" />
        <ListItem icon={<I.Coffee />} title="Coffee" meta="08:05 am • 11 November, 2026" amount="$4.75" href="#tx" />
        <ListItem icon={<I.Dumbbell />} title="Gym" meta="07:00 am • 10 November, 2026" amount="$39.00" href="#tx" />
        <ListItem icon={<I.Banknote />} title="Salary" meta="09:00 am • 1 November, 2026" amount="+$3,200.00" tone="income" href="#tx" />
      </SectionCard>
    </AppPage>
  );
}


/** All 50 category icons (DB keys), in the CategoryGrid circle style. */
function CategoryIconsMock() {
  const keys = Object.keys(CATEGORY_ICONS);
  const old = getIconSet() === "lucide";
  return (
    <AppPage tab="admin">
      <PageHeader title="Category icons" subtitle={`${keys.length} icons · DB keys unchanged`} />
      <div className="grid grid-cols-5 gap-x-[4px] gap-y-[14px] rounded-(--sp-radius) bg-(--sp-panel) px-[6px] py-[16px]">
        {keys.map((k, i) => {
          const Icon = old ? CATEGORY_ICONS[k] : CATEGORY_ICON_MAP[k];
          const on = i === 4;
          return (
            <span key={k} className="flex min-w-0 flex-col items-center gap-[6px] leading-[1.5]">
              <span
                className={
                  "flex size-[48px] items-center justify-center rounded-full [&_svg]:size-[20px] " +
                  (on ? "bg-(--sp-chip-active) text-(--sp-chip-active-text)" : "bg-(--sp-soft) text-(--sp-text)")
                }
              >
                <Icon className="size-[20px] stroke-[1.8]" />
              </span>
              <span className="-my-[0.25em] w-full truncate text-center text-[0.5625rem] leading-[1.5] text-(--sp-text-muted)">{k}</span>
            </span>
          );
        })}
      </div>
    </AppPage>
  );
}


/** Amount with − / + (hold to repeat): steps whole units, keeps the cents, never below 0. */
function AmountDemo({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const num = Number.parseFloat(value.replace(",", ".")) || 0;
  return (
    <AmountField
      id="amount"
      symbol="$"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onStep={(d) =>
        setValue((v) => {
          const n = Number.parseFloat(v.replace(",", ".")) || 0;
          const cents = v.includes(".") || v.includes(",") ? 2 : 0;
          return Math.max(0, n + d).toFixed(cents);
        })
      }
      canDecrement={num >= 1}
    />
  );
}

/* ---------- search + filters (redesign) ---------- */

const TODAY = "2026-11-12";

function ListRows({ rows }: { rows: { icon: ReactNode; title: string; meta: string; amount: string; income?: boolean }[] }) {
  return (
    <>
      {rows.map((r) => (
        <ListItem key={r.title + r.meta} icon={r.icon} title={r.title} meta={r.meta} amount={r.amount} tone={r.income ? "income" : "expense"} href="#tx" />
      ))}
    </>
  );
}

function TxListMock() {
  return (
    <AppPage tab="expenses">
      <PageHeader title="Expenses" subtitle="Company" action={<IconButton label="Add expense" icon={<I.Plus />} variant="ink" />} />
      <PeriodBar label="November 2026" summary="24 expenses · −$3,922.40" onPrev={() => {}} onNext={() => {}} canNext={false} onLabelClick={() => {}} />
      <SearchBar placeholder="Description, comment, website" value="" onChange={() => {}} onFilterClick={() => {}} />
      <SectionCard title="Thu 12 Nov">
        <ListRows
          rows={[
            { icon: <I.Hotel />, title: "Hotel Rabat", meta: "Sam Tremblay • 02:44 am", amount: "$120.00" },
            { icon: <I.Utensils />, title: "Client Lunch", meta: "Adam Admin • 12:40 pm", amount: "$186.40" },
          ]}
        />
      </SectionCard>
      <SectionCard title="Wed 11 Nov">
        <ListRows
          rows={[
            { icon: <I.Wifi />, title: "Internet Bill", meta: "Sam Tremblay • 09:00 am", amount: "$55.00" },
            { icon: <I.Car />, title: "Taxi to the airport", meta: "Emma Employee • 07:15 am", amount: "$54.20" },
          ]}
        />
      </SectionCard>
    </AppPage>
  );
}

function TxListFilteredMock() {
  return (
    <AppPage tab="expenses">
      <PageHeader title="Expenses" subtitle="Company" action={<IconButton label="Add expense" icon={<I.Plus />} variant="ink" />} />
      <PeriodBar range label="12 Oct – 11 Nov 2026" summary="7 results · −$1,184.60" onClearRange={() => {}} onLabelClick={() => {}} />
      <SearchBar
        placeholder="Description, comment, website"
        value="hotel"
        onChange={() => {}}
        onClear={() => {}}
        onFilterClick={() => {}}
        filterCount={4}
      />
      <ActiveFilters
        onClearAll={() => {}}
        items={[
          { key: "type", label: "Expense", onRemove: () => {} },
          { key: "travel", label: "Travel", icon: <I.Plane />, onRemove: () => {} },
          { key: "taxi", label: "Transport › Taxi", icon: <I.Car />, onRemove: () => {} },
          { key: "amount", label: "$50 – $500", onRemove: () => {} },
        ]}
      />
      <SectionCard title="Thu 12 Nov">
        <ListRows rows={[{ icon: <I.Hotel />, title: "Hotel Rabat", meta: "Travel › Hotels • Sam Tremblay", amount: "$120.00" }]} />
      </SectionCard>
      <SectionCard title="Mon 2 Nov">
        <ListRows
          rows={[
            { icon: <I.Plane />, title: "Hotel + flight Toronto", meta: "Travel • Adam Admin", amount: "$412.00" },
            { icon: <I.Car />, title: "Taxi to the hotel", meta: "Transport › Taxi • Sam Tremblay", amount: "$64.80" },
          ]}
        />
      </SectionCard>
    </AppPage>
  );
}

const FILTER_CATS: CategoryOption[] = [
  { id: "bills", name: "Bills", icon: <I.Receipt /> },
  { id: "food", name: "Food", icon: <I.Utensils /> },
  { id: "office", name: "Office", icon: <I.Briefcase /> },
  { id: "software", name: "Software", icon: <I.Laptop /> },
  {
    id: "transport",
    name: "Transport",
    icon: <I.Car />,
    children: [
      { id: "taxi", name: "Taxi" },
      { id: "fuel", name: "Fuel" },
      { id: "parking", name: "Parking" },
    ],
  },
  { id: "travel", name: "Travel", icon: <I.Plane /> },
  { id: "other", name: "Other", icon: <I.Ellipsis /> },
];

function SheetSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-[color-mix(in_oklab,var(--sp-text)_8%,transparent)] pt-[16px] pb-[18px] first:border-t-0 first:pt-[4px]">
      <div className="mb-[12px] flex items-baseline justify-between gap-3 leading-[1.5] [&>*]:-my-[0.25em]">
        <h3 className="text-[0.8125rem] font-medium text-(--sp-text)">{title}</h3>
        {hint ? <span className="text-[0.625rem] text-(--sp-text-faint)">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function FilterSheetBody({ wallet }: { wallet?: boolean }) {
  const [cats, setCats] = useState<string[]>(["travel", "taxi"]);
  return (
    <>
      <SheetSection title="Date">
        <div role="group" aria-label="Date presets" className="flex flex-wrap gap-[8px]">
          <FilterChip surface="panel" label="This month" />
          <FilterChip surface="panel" label="Last month" />
          <FilterChip surface="panel" label="Last 3 months" />
          <FilterChip surface="panel" label="This year" />
          <FilterChip surface="panel" label="Custom…" active icon={<I.CalendarDays />} />
        </div>
        <button
          type="button"
          className="mt-[10px] flex h-[52px] w-full items-center gap-[10px] rounded-[16px] bg-(--sp-soft) px-[14px] text-left outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
        >
          <span className="text-(--sp-card-front) [&_svg]:size-[20px]">
            <I.CalendarDays />
          </span>
          <span className="min-w-0 flex-1 text-[0.8125rem] font-medium text-(--sp-text)">12 Oct – 11 Nov 2026</span>
          <span className="text-[0.6875rem] font-medium text-(--sp-card-front)">Change</span>
        </button>
      </SheetSection>
      <SheetSection title="Type">
        <Segmented
          label="Type"
          surface="panel"
          value="expense"
          items={[
            { value: "all", label: "All" },
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />
      </SheetSection>
      <SheetSection title="Categories" hint={cats.length ? `${cats.length} chosen` : "All"}>
        <CategoryMultiGrid options={FILTER_CATS} value={cats} onValueChange={setCats} />
      </SheetSection>
      <SheetSection title="Amount" hint="USD">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[8px]">
          <SpInput surface="panel" inputMode="decimal" placeholder="Min" defaultValue="50" aria-label="Minimum amount" />
          <span className="text-(--sp-text-faint)">–</span>
          <SpInput surface="panel" inputMode="decimal" placeholder="Max" defaultValue="500" aria-label="Maximum amount" />
        </div>
      </SheetSection>
      {wallet ? null : (
        <SheetSection title="Created by" hint="Admins only">
          <div role="group" aria-label="Created by" className="flex flex-wrap gap-[8px]">
            <FilterChip surface="panel" label="Anyone" active />
            <FilterChip surface="panel" label="Sam Tremblay" />
            <FilterChip surface="panel" label="Adam Admin" />
            <FilterChip surface="panel" label="Emma Employee" />
          </div>
        </SheetSection>
      )}
    </>
  );
}

function FilterSheetMock() {
  return (
    <>
      <TxListFilteredMock />
      <OpenSheet
        title="Filters"
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
            <SpButton variant="secondary">Reset</SpButton>
            <SpButton>Show 7 results</SpButton>
          </div>
        }
      >
        <FilterSheetBody />
      </OpenSheet>
    </>
  );
}

function FilterDateMock() {
  const [range, setRange] = useState<{ from?: string; to?: string }>({ from: "2026-10-12", to: "2026-11-11" });
  return (
    <>
      <TxListFilteredMock />
      <OpenSheet
        title="Dates"
        description="Tap the first day, then the last day."
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
            <SpButton variant="secondary">Cancel</SpButton>
            <SpButton>Use 12 Oct – 11 Nov</SpButton>
          </div>
        }
      >
        <div role="group" aria-label="Date presets" className="flex flex-wrap gap-[8px]">
          <FilterChip surface="panel" label="This month" />
          <FilterChip surface="panel" label="Last month" />
          <FilterChip surface="panel" label="Last 3 months" />
          <FilterChip surface="panel" label="This year" />
        </div>
        <DateRangePicker className="mt-[14px]" today={TODAY} initialMonth="2026-11" from={range.from} to={range.to} onChange={setRange} />
      </OpenSheet>
    </>
  );
}

function WalletListFilteredMock() {
  return (
    <AppPage tab="wallet">
      <PageHeader title="Wallet" subtitle="Personal · only you" action={<IconButton label="Add to wallet" icon={<I.Plus />} variant="ink" />} />
      <PeriodBar range label="Last 3 months" summary="12 Aug – 11 Nov · 9 results · −$486.30" onClearRange={() => {}} onLabelClick={() => {}} />
      <SearchBar placeholder="Description, comment, website" value="" onChange={() => {}} onFilterClick={() => {}} filterCount={1} />
      <ActiveFilters
        onClearAll={() => {}}
        items={[
          { key: "food", label: "Food", icon: <I.ShoppingCart />, onRemove: () => {} },
        ]}
      />
      <SectionCard title="November">
        <ListRows
          rows={[
            { icon: <I.ShoppingCart />, title: "Groceries", meta: "Food › Groceries • Wed 11 Nov", amount: "$48.00" },
            { icon: <I.Coffee />, title: "Coffee", meta: "Food › Restaurants • Tue 10 Nov", amount: "$2.80" },
          ]}
        />
      </SectionCard>
      <SectionCard title="October">
        <ListRows
          rows={[
            { icon: <I.ShoppingCart />, title: "Market", meta: "Food › Groceries • Sat 24 Oct", amount: "$31.25" },
            { icon: <I.Utensils />, title: "Dinner with family", meta: "Food › Restaurants • Fri 9 Oct", amount: "$64.00" },
          ]}
        />
      </SectionCard>
    </AppPage>
  );
}

/* ---------- one structure for Company and Wallet ---------- */

type Space = "company" | "wallet";

const SPACE = {
  company: {
    name: "Company",
    sub: "Norden Capital · your team's expenses",
    tab: "expenses" as Tab,
    listTitle: "Expenses",
  },
  wallet: {
    name: "Wallet",
    sub: "Personal · only you",
    tab: "wallet" as Tab,
    listTitle: "Wallet",
  },
};

/** Wrapper: wallet pages get the yellow card colour, nothing else changes. */
function SpaceWrap({ space, children }: { space: Space; children: ReactNode }) {
  return (
    <div className={(space === "wallet" ? "sp-space-wallet " : "") + "contents space-y-[16px]"}>{children}</div>
  );
}

function SpaceHeader({ space, back, title }: { space: Space; back?: string; title?: string }) {
  const s = SPACE[space];
  return (
    <PageHeader
      back={back ? { href: back, label: `Back to ${s.name}` } : undefined}
      title={title ?? s.name}
      subtitle={s.sub}
      action={
        space === "wallet" ? (
          <IconButton label="Lock wallet" icon={<I.Lock />} />
        ) : (
          <IconButton label="Search" icon={<I.Search />} />
        )
      }
    />
  );
}

/** Company home: Company card (purple) in front, Personal wallet (yellow, locked) behind. */
function CompanyStack({ front = 0 }: { front?: 0 | 1 }) {
  return (
    <SwapStack
      defaultFront={front}
      labels={["Company", "Personal wallet"]}
      cards={[
        <BalanceCard
          key="company"
          tag="Company"
          amountLabel="Out this month"
          amount="$3,922.40"
          detail={{ label: "In", value: "+$500.00" }}
          footer={{ label: "Net", value: "−$3,422.40" }}
          action={<AddPill label="Expense" icon={<I.Plus className="size-[16px]" />} />}
        />,
        <div key="wallet" className="sp-card-sun">
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
            action={<AddPill label="Unlock" icon={<I.Lock className="size-[18px]" />} />}
          />
        </div>,
      ]}
    />
  );
}

/** Wallet: Wallet card (yellow) in front; behind it Savings (option A, favourite) or Budget (option B). */
function WalletStack({ front = 0, back = "savings" }: { front?: 0 | 1; back?: "savings" | "budget" }) {
  return (
    <SwapStack
      defaultFront={front}
      labels={["Personal wallet", back === "savings" ? "Savings" : "Budget"]}
      cards={[
        <div key="wallet" className="sp-card-sun">
          <BalanceCard
            tag="Personal wallet"
            amountLabel="Balance"
            amount="$2,486.15"
            detail={{ label: "This month", value: "−$612.00" }}
            footer={{ label: "Out this month", value: "$812.00" }}
            action={<AddPill label="Expense" icon={<I.Plus className="size-[16px]" />} />}
          />
        </div>,
        back === "savings" ? (
          <div key="savings" className="sp-card-ink">
            <BalanceCard
              tag="Savings · 3 goals"
              amountLabel="Saved in goals"
              amount="$1,850.00"
              detail={{ label: "Target", value: "$5,000" }}
              footer={{ label: "Progress", value: "37% · Laptop next" }}
              action={<AddPill label="Goals" icon={<I.Target className="size-[18px]" />} />}
            />
          </div>
        ) : (
          <div key="budget" className="sp-card-ink">
            <BalanceCard
              tag="Budget · November"
              amountLabel="Spent of your budgets"
              amount="$645.00"
              detail={{ label: "Budgets", value: "$920" }}
              footer={{ label: "Left", value: "$275 · 18 days" }}
              action={<AddPill label="Budgets" icon={<I.PiggyBank className="size-[18px]" />} />}
            />
          </div>
        ),
      ]}
    />
  );
}


/** "Set a goal" opens this sheet directly (real fields: name, target, deadline; USD only). */
function GoalSheet() {
  return (
    <div className="sp-space-wallet contents">
      <OpenSheet
        title="Set a goal"
        description="Save for something. Add money to it when you can."
        footer={<SpButton className="w-full">Create goal</SpButton>}
      >
        <div className="space-y-[14px]">
          <SpField label="Name" htmlFor="gname">
            <SpInput id="gname" surface="panel" placeholder="e.g. Summer trip" defaultValue="New laptop" />
          </SpField>
          <div className="grid grid-cols-2 gap-[10px]">
            <SpField label="Target" htmlFor="gtarget">
              <SpInput id="gtarget" surface="panel" inputMode="decimal" placeholder="0.00" defaultValue="2,400.00" icon={<span className="text-[0.9375rem] font-medium">$</span>} />
            </SpField>
            <SpField label="Deadline" htmlFor="gdate" optional>
              <SpInput id="gdate" surface="panel" type="date" defaultValue="2027-03-31" />
            </SpField>
          </div>
        </div>
      </OpenSheet>
    </div>
  );
}

/** "Set a budget" opens this sheet directly (real fields: category, monthly limit; USD only). */
function BudgetSheet() {
  return (
    <div className="sp-space-wallet contents">
      <OpenSheet
        title="Set a budget"
        description="A monthly limit for one category. You see how much is left."
        footer={<SpButton className="w-full">Create budget</SpButton>}
      >
        <div className="space-y-[14px]">
          <CategoryGrid
            options={WALLET_CATS.map((c) => ({ ...c, children: undefined }))}
            value="food"
            className="bg-(--sp-soft) [&_[role=radio]>span:first-child]:bg-(--sp-panel)"
          />
          <SpField label="Monthly limit" htmlFor="blimit">
            <SpInput id="blimit" surface="panel" inputMode="decimal" placeholder="0.00" defaultValue="600.00" icon={<span className="text-[0.9375rem] font-medium">$</span>} />
          </SpField>
        </div>
      </OpenSheet>
    </div>
  );
}

/** Dashboard: same order for both spaces. */
function SpaceDashboard({
  space,
  front = 0,
  back = "savings",
  sheet,
}: {
  space: Space;
  front?: 0 | 1;
  back?: "savings" | "budget";
  sheet?: "goal" | "budget";
}) {
  const company = space === "company";
  return (
    <>
    <AppPage tab={company ? "home" : "wallet"}>
      <SpaceWrap space={space}>
        <SpaceHeader space={space} />
        {/* 1. two cards: tap the back card (or swipe) to bring it to the front */}
        {company ? <CompanyStack front={front} /> : <WalletStack front={front} back={back} />}
        {/* 2. quick actions (no "Add": the card's "+ Expense" pill does it).
             Same frame: slot 1 = repeat items, slot 4 = Search; slots 2–3 = the space's own. */}
        <QuickActions>
          {company ? (
            <>
              <QuickAction label="Repeat" icon={<I.Repeat />} />
              <QuickAction label="All" icon={<I.ArrowLeftRight />} />
              <QuickAction label="Alerts" icon={<I.Bell />} />
              <QuickAction label="Search" icon={<I.Search />} />
            </>
          ) : (
            <>
              <QuickAction label="Recurring" icon={<I.Repeat />} />
              <QuickAction label="Set a goal" icon={<I.Target />} />
              <QuickAction label="Set a budget" icon={<I.PiggyBank />} />
              <QuickAction label="Search" icon={<I.Search />} />
            </>
          )}
        </QuickActions>
        {/* 3. due soon (repeat items) */}
        <SectionCard title="Due soon" action={{ label: "View All", href: "#repeat" }}>
          {company ? (
            <>
              <ListItem icon={<I.Wifi />} title="Internet Bill" meta="Repeats monthly • in 3 days, 15 Nov" amount="$55.00" href="#r" />
              <ListItem icon={<I.Building2 />} title="Office rent" meta="Repeats monthly • in 18 days, 30 Nov" amount="$1,800.00" href="#r" />
            </>
          ) : (
            <>
              <ListItem icon={<I.Dumbbell />} title="Gym" meta="Repeats monthly • tomorrow, 13 Nov" amount="$39.00" href="#r" />
              <ListItem icon={<I.Film />} title="Streaming" meta="Repeats monthly • in 6 days, 18 Nov" amount="$12.99" href="#r" />
            </>
          )}
        </SectionCard>
        {/* 4. the space's own section (wallet only; the company has none) */}
        {company ? null : (
          <SpPanel title="Budgets this month" aside={<span className="text-[0.625rem] text-(--sp-text-faint)">2 of 3 on track</span>}>
            <div className="space-y-[16px]">
              <ProgressBar label="Food" valueText="$420 of $600" value={0.7} />
              <ProgressBar label="Transport" valueText="$95 of $200" value={0.475} tone="ink" />
              <ProgressBar label="Fun" valueText="$130 of $120" value={1.08} />
            </div>
          </SpPanel>
        )}
        {/* 5. recent */}
        <SectionCard title="Recent" action={{ label: "View All", href: "#list" }}>
          {company ? (
            <>
              <ListItem icon={<I.Hotel />} title="Hotel Rabat" meta="Travel › Hotels • Thu 12 Nov" amount="$120.00" href="#tx" />
              <ListItem icon={<I.Utensils />} title="Client Lunch" meta="Food • Thu 12 Nov" amount="$186.40" href="#tx" />
              <ListItem icon={<I.Car />} title="Taxi to client" meta="Transport › Taxi • Wed 11 Nov" amount="$45.00" href="#tx" />
            </>
          ) : (
            <>
              <ListItem icon={<I.ShoppingCart />} title="Groceries" meta="Food › Groceries • Wed 11 Nov" amount="$50.00" href="#tx" />
              <ListItem icon={<I.Coffee />} title="Coffee" meta="Food • Wed 11 Nov" amount="$4.75" href="#tx" />
              <ListItem icon={<I.Banknote />} title="Salary" meta="Income • Sun 1 Nov" amount="+$3,200.00" tone="income" href="#tx" />
            </>
          )}
        </SectionCard>
      </SpaceWrap>
    </AppPage>
    {sheet === "goal" ? <GoalSheet /> : sheet === "budget" ? <BudgetSheet /> : null}
    </>
  );
}

/** List: identical for both (period bar, search + filters, days). */
function SpaceList({ space }: { space: Space }) {
  const company = space === "company";
  const s = SPACE[space];
  return (
    <AppPage tab={s.tab}>
      <SpaceWrap space={space}>
        <PageHeader
          title={s.listTitle}
          subtitle={s.sub}
          action={<IconButton label="Add expense" icon={<I.Plus />} variant="ink" />}
        />
        <PeriodBar
          label="November 2026"
          summary={company ? "24 expenses · −$3,922.40" : "18 entries · −$612.00"}
          onPrev={() => {}}
          onNext={() => {}}
          canNext={false}
          onLabelClick={() => {}}
        />
        <SearchBar placeholder="Description, comment, website" value="" onChange={() => {}} onFilterClick={() => {}} />
        <SectionCard title="Thu 12 Nov">
          {company ? (
            <>
              <ListItem icon={<I.Hotel />} title="Hotel Rabat" meta="Travel › Hotels • Sam Tremblay" amount="$120.00" href="#tx" />
              <ListItem icon={<I.Utensils />} title="Client Lunch" meta="Food • Adam Admin" amount="$186.40" href="#tx" />
            </>
          ) : (
            <>
              <ListItem icon={<I.ShoppingCart />} title="Groceries" meta="Food › Groceries" amount="$50.00" href="#tx" />
              <ListItem icon={<I.Coffee />} title="Coffee" meta="Food" amount="$4.75" href="#tx" />
            </>
          )}
        </SectionCard>
        <SectionCard title="Wed 11 Nov">
          {company ? (
            <>
              <ListItem icon={<I.Wifi />} title="Internet Bill" meta="Bills • Sam Tremblay" amount="$55.00" href="#tx" />
              <ListItem icon={<I.Car />} title="Taxi to client" meta="Transport › Taxi • Emma Employee" amount="$45.00" href="#tx" />
            </>
          ) : (
            <>
              <ListItem icon={<I.Dumbbell />} title="Gym" meta="Health • repeat" amount="$39.00" href="#tx" />
              <ListItem icon={<I.Banknote />} title="Refund" meta="Income" amount="+$20.00" tone="income" href="#tx" />
            </>
          )}
        </SectionCard>
      </SpaceWrap>
    </AppPage>
  );
}

/** Detail: identical (hero card, actions, facts, proof, [comments: company], history). */
function SpaceDetail({ space }: { space: Space }) {
  const company = space === "company";
  return (
    <AppPage tab={SPACE[space].tab}>
      <SpaceWrap space={space}>
        <SpaceHeader space={space} back="#list" title="Expense" />
        <TxHero
          tone={company ? "company" : "wallet"}
          icon={company ? <I.Hotel /> : <I.ShoppingCart />}
          tag={company ? "Company" : "Wallet"}
          title={company ? "Hotel Rabat" : "Groceries"}
          meta={company ? "Travel › Hotels · Thu 12 Nov 2026" : "Food › Groceries · Wed 11 Nov 2026"}
          amount={company ? "−$120.00" : "−$50.00"}
          kind="Expense"
        />
        <div className="grid grid-cols-3 gap-[8px]">
          <SpButton size="md" icon={<I.Pencil />}>
            Edit
          </SpButton>
          <SpButton size="md" variant="secondary" icon={<I.Copy />}>
            Copy
          </SpButton>
          <SpButton size="md" variant="danger" icon={<I.Trash2 />}>
            Delete
          </SpButton>
        </div>
        <InfoList
          rows={[
            { label: "Category", value: company ? "Travel › Hotels" : "Food › Groceries" },
            { label: "Added", value: company ? "Sam Tremblay · 12 Nov, 02:44" : "11 Nov, 18:20" },
            { label: "Website", value: company ? "hotelrabat.ma" : "—" },
          ]}
        />
        <SpPanel title="Proof" aside={<span className="text-[0.625rem] text-(--sp-text-faint)">{company ? "1 file" : "Optional"}</span>}>
          <ProofTiles files={[{ id: "1", name: company ? "receipt.png" : "ticket.jpg", size: "122 KB", url: RECEIPT_IMG }]} />
        </SpPanel>
        {company ? (
          <SpPanel title="Comments">
            <CommentThread
              comments={[{ id: "1", author: "Adam Admin", time: "12 Nov, 09:12", text: "For the client visit on Friday?" }]}
              composer={{}}
            />
          </SpPanel>
        ) : null}
        <SpPanel title="History">
          <Timeline entries={[{ id: "1", title: company ? "Added by Sam Tremblay" : "Added", meta: "12 Nov 2026, 02:44", current: true }]} />
        </SpPanel>
      </SpaceWrap>
    </AppPage>
  );
}

/** Form: identical order (type, amount, date, description, category, website, proof). */
function SpaceForm({ space }: { space: Space }) {
  const company = space === "company";
  return (
    <FormPage bar={<SpButton className="w-full">Save expense</SpButton>}>
      <SpaceWrap space={space}>
        <PageHeader title="New expense" subtitle={SPACE[space].sub} action={<IconButton label="Close" icon={<I.X />} />} />
        <Segmented
          label="Type"
          value="expense"
          items={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />
        <AmountDemo initial="120" />
        <SpField label="Date" htmlFor="sdate">
          <SpInput id="sdate" type="date" defaultValue="2026-11-12" />
        </SpField>
        <SpField label="Description" htmlFor="sdesc">
          <SpInput id="sdesc" placeholder="e.g. Taxi to the client" defaultValue={company ? "Hotel Rabat" : "Groceries"} />
        </SpField>
        {company ? (
          <CategoryGrid options={COMPANY_CATS} value="transport" subValue="taxi" />
        ) : (
          <CategoryGrid options={WALLET_CATS} value="food" subValue="groceries" />
        )}
        <SpField label="Website" htmlFor="sweb" optional>
          <SpInput id="sweb" inputMode="url" placeholder="e.g. hotelrabat.ma" icon={<I.Globe />} />
        </SpField>
        <SpField label="Proof" optional={!company} hint="A photo of the receipt, or a PDF.">
          <ProofTiles surface="page" onAdd={() => {}} files={[]} />
        </SpField>
      </SpaceWrap>
    </FormPage>
  );
}


/** Repeat payments with due badges (urgency colours), every state. */
function GlassCardsMock() {
  const plus = <I.Plus className="size-[16px]" />;
  return (
    <AppPage tab="home">
      <PageHeader title="Glass cards" subtitle="liquid-glass-react values (MIT), iPhone-safe" />
      <SwapStack
        glass
        labels={["Company", "Wallet"]}
        cards={[
          <BalanceCard
            key="c"
            glass
            tag="Company"
            amountLabel="This month"
            amount="$3,922.40"
            detail={{ label: "In", value: "+$500.00" }}
            footer={{ label: "Name", value: "Sam Tremblay" }}
            action={<AddPill glass label="Expense" icon={plus} />}
          />,
          <div key="w" className="sp-card-sun">
            <BalanceCard glass tag="Wallet" amountLabel="Balance" amount="$812.10" detail={{ label: "In", value: "+$1,200.00" }} />
          </div>,
        ]}
      />
      <SwapStack
        glass
        defaultFront={1}
        labels={["Company", "Personal wallet"]}
        cards={[
          <BalanceCard key="c" glass tag="Company" amountLabel="This month" amount="$3,922.40" detail={{ label: "In", value: "+$500.00" }} />,
          <div key="w" className="sp-card-sun">
            <BalanceCard
              glass
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
      <SwapStack
        glass
        labels={["Personal wallet", "Savings"]}
        cards={[
          <div key="w" className="sp-card-sun">
            <BalanceCard
              glass
              tag="Personal wallet"
              amountLabel="Balance"
              amount="$2,486.15"
              detail={{ label: "In", value: "+$1,200.00" }}
              footer={{ label: "Out this month", value: "−$812.00" }}
              action={<AddPill glass label="Expense" icon={plus} />}
            />
          </div>,
          <div key="s" className="sp-card-ink">
            <BalanceCard glass tag="Savings · 3 goals" amountLabel="Saved in goals" amount="$1,850.00" detail={{ label: "Target", value: "$5,000" }} />
          </div>,
        ]}
      />
      <div className="sp-card-ink">
        <BalanceCard
          glass
          tag="Savings · 3 goals"
          amountLabel="Saved in goals"
          amount="$1,850.00"
          detail={{ label: "Target", value: "$5,000" }}
          footer={{ label: "Progress", value: "37% · Laptop next" }}
          action={<AddPill glass label="Goals" icon={<I.Target className="size-[18px]" />} />}
        />
      </div>
    </AppPage>
  );
}

function MoneyTonesMock() {
  return (
    <AppPage>
      <PageHeader title="Money tones" subtitle="Sign + calm colour, AA everywhere" />
      <BalanceCard
        tag="Company"
        amountLabel="This month"
        amount="$3,922.40"
        detail={{ label: "In", value: "+$500.00", direction: "in" }}
        footer={{ label: "Out", value: "−$4,422.40", direction: "out" }}
      />
      <div className="sp-space-wallet">
        <BalanceCard tag="Wallet" amountLabel="Balance" amount="$812.10" detail={{ label: "In", value: "+$1,200.00", direction: "in" }} footer={{ label: "Out", value: "−$387.90", direction: "out" }} />
      </div>
      <div className="sp-card-ink">
        <BalanceCard tag="Savings" amountLabel="Saved" amount="$2,400.00" detail={{ label: "In", value: "+$300.00", direction: "in" }} footer={{ label: "Out", value: "−$50.00", direction: "out" }} />
      </div>
      <SectionCard title="Recent">
        <ListItem icon={<I.Utensils />} title="Client lunch" meta="12 Nov" amount="−$186.40" tone="expense" />
        <ListItem icon={<I.Wallet />} title="Refund" meta="11 Nov" amount="+$500.00" tone="income" />
        <ListItem icon={<I.ArrowLeftRight />} title="Move to savings" meta="10 Nov" amount="$100.00" tone="neutral" />
      </SectionCard>
      <p className="px-[4px] text-[0.8125rem]">
        On the page: <SpMoney direction="in">+$500.00</SpMoney> · <SpMoney direction="out">−$120.00</SpMoney> · Net <SpMoney direction="net">+$380.00</SpMoney>
      </p>
      <p className="rounded-[16px] bg-(--sp-input) px-[16px] py-[14px] text-[0.8125rem]">
        On a fill: <SpMoney direction="in">+$500.00</SpMoney> · <SpMoney direction="out">−$120.00</SpMoney>
      </p>
    </AppPage>
  );
}

function DueBadgesMock() {
  const rows: { icon: ReactNode; title: string; every: string; amount: string; state: "overdue" | "today" | "soon" | "week" | "later" | "paused"; label: string }[] = [
    { icon: <I.Wifi />, title: "Internet Bill", every: "Monthly", amount: "$55.00", state: "overdue", label: "Overdue · 2 days" },
    { icon: <I.Dumbbell />, title: "Gym", every: "Monthly", amount: "$39.00", state: "today", label: "Today" },
    { icon: <I.Film />, title: "Streaming", every: "Monthly", amount: "$12.99", state: "soon", label: "In 2 days" },
    { icon: <I.Smartphone />, title: "Phone plan", every: "Monthly", amount: "$45.00", state: "week", label: "In 5 days" },
    { icon: <I.Building2 />, title: "Office rent", every: "Monthly", amount: "$1,800.00", state: "later", label: "Fri 27 Nov" },
    { icon: <I.Laptop />, title: "Software licence", every: "Yearly", amount: "$240.00", state: "paused", label: "Paused" },
  ];
  return (
    <AppPage tab="wallet">
      <PageHeader title="Repeat payments" subtitle="Next date first" action={<IconButton label="Add repeat payment" icon={<I.Plus />} variant="ink" />} />
      <RowGroup title="Coming up">
        {rows.map((r) => (
          <SpRow
            key={r.title}
            href="#r"
            leading={<RowIcon>{r.icon}</RowIcon>}
            title={r.title}
            subtitle={
              <span className="flex items-center gap-[8px] pt-[3px]">
                <DueBadge state={r.state} label={r.label} />
                <span className="text-(--sp-text-faint)">{r.every}</span>
              </span>
            }
            trailing={<span className="pr-[4px] text-[0.8125rem] font-semibold text-(--sp-text) tabular-nums">{r.amount}</span>}
          />
        ))}
      </RowGroup>
      <SpPanel title="All states">
        <div className="flex flex-wrap gap-[8px]">
          <DueBadge state="overdue" label="Overdue · 2 days" />
          <DueBadge state="today" label="Today" />
          <DueBadge state="soon" label="In 2 days" />
          <DueBadge state="week" label="In 5 days" />
          <DueBadge state="paused" label="Paused" />
          <span className="flex h-[22px] items-center">
            <DueBadge state="later" label="Fri 27 Nov" />
          </span>
        </div>
      </SpPanel>
    </AppPage>
  );
}


const D_TODAY = "2026-11-12";
const D_TOMORROW = "2026-11-13";

/** Every date input as the kit DateField (the 5 rules from Frontend). */
function DateFieldsMock() {
  const [box, setBox] = useState<HTMLElement | null>(null);
  const [txDate, setTxDate] = useState<string | null>(D_TODAY);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(D_TODAY);
  const [end, setEnd] = useState<string | null>(null);
  const [pause, setPause] = useState<string | null>(null);
  return (
    <AppPage tab="wallet">
      <div ref={setBox} />
      <PageHeader title="Dates" subtitle="Every date uses the kit calendar" />
      <SpPanel title="Expense">
        <DateField label="Date" value={txDate} onChange={setTxDate} max={D_TODAY} today={D_TODAY} surface="panel" container={box} hint="No dates in the future." />
      </SpPanel>
      <SpPanel title="Goal">
        <DateField label="Deadline" value={deadline} onChange={setDeadline} min={D_TOMORROW} today={D_TODAY} optional surface="panel" container={box} placeholder="No deadline" />
      </SpPanel>
      <SpPanel title="Repeat payment">
        <div className="space-y-[14px]">
          <DateField label="Starts" value={start} onChange={setStart} today={D_TODAY} surface="panel" container={box} />
          <DateField label="Ends" value={end} onChange={setEnd} min={start ?? undefined} today={D_TODAY} optional surface="panel" container={box} placeholder="Never" />
          <DateField label="Pause until" value={pause} onChange={setPause} min={D_TOMORROW} today={D_TODAY} optional surface="panel" container={box} placeholder="Not paused" />
        </div>
      </SpPanel>
      <SpPanel title="With an error">
        <DateField label="Date" value={null} onChange={() => {}} today={D_TODAY} surface="panel" container={box} error="Choose a date." />
      </SpPanel>
    </AppPage>
  );
}

/** The single-date sheet open (what DateField shows on tap). */
function DateSheetMock() {
  const [day, setDay] = useState<string>("2026-11-10");
  return (
    <>
      <DateFieldsMock />
      <OpenSheet
        title="Date"
        description="Tue 10 Nov 2026"
        footer={<SpButton className="w-full">Done</SpButton>}
      >
        <Calendar mode="single" today={D_TODAY} max={D_TODAY} value={day} onSelect={setDay} />
      </OpenSheet>
    </>
  );
}

/* ---------- registry ---------- */

const MOCKS: Record<string, () => ReactNode> = {
  ...BALANCE_MOCKS,
  ...NOTIFICATION_MOCKS,
  ...GOALS_MOCKS,
  ...CURRENCY_MOCKS,
  home: () => <HomeMock />,
  "date-fields": () => <DateFieldsMock />,
  "date-sheet": () => <DateSheetMock />,
  "due-badges": () => <DueBadgesMock />,
  "money-tones": () => <MoneyTonesMock />,
  "glass-cards": () => <GlassCardsMock />,
  "space-dash-company": () => <SpaceDashboard space="company" />,
  "space-dash-wallet": () => <SpaceDashboard space="wallet" />,
  "space-dash-company-swapped": () => <SpaceDashboard space="company" front={1} />,
  "space-dash-wallet-swapped": () => <SpaceDashboard space="wallet" front={1} />,
  "space-dash-wallet-budget": () => <SpaceDashboard space="wallet" back="budget" />,
  "space-dash-wallet-budget-swapped": () => <SpaceDashboard space="wallet" back="budget" front={1} />,
  "space-dash-wallet-goal-sheet": () => <SpaceDashboard space="wallet" sheet="goal" />,
  "space-dash-wallet-budget-sheet": () => <SpaceDashboard space="wallet" sheet="budget" />,
  "space-list-company": () => <SpaceList space="company" />,
  "space-list-wallet": () => <SpaceList space="wallet" />,
  "space-detail-company": () => <SpaceDetail space="company" />,
  "space-detail-wallet": () => <SpaceDetail space="wallet" />,
  "space-form-company": () => <SpaceForm space="company" />,
  "space-form-wallet": () => <SpaceForm space="wallet" />,
  "tx-list": () => <TxListMock />,
  "tx-list-filtered": () => <TxListFilteredMock />,
  "filter-sheet": () => <FilterSheetMock />,
  "filter-date": () => <FilterDateMock />,
  "wallet-list-filtered": () => <WalletListFilteredMock />,
  "category-icons": () => <CategoryIconsMock />,
  wallet: () => <WalletMock />,
  "tx-detail": () => <TxDetail />,
  "wallet-tx-detail": () => <WalletTxDetail />,
  "tx-new": () => <TxNew />,
  "wallet-tx-edit": () => <WalletTxEdit />,
  "tx-duplicate": () => <TxDuplicate />,
  "settings-account": () => <SettingsAccount />,
  "settings-security": () => <SettingsSecurity />,
  "settings-preferences": () => <SettingsPreferences />,
  "logout-sheet": () => <LogoutSheet />,
  "admin-users": () => <AdminUsers />,
  "admin-user-detail": () => <AdminUserDetail />,
  "admin-categories": () => <AdminCategories />,
  "admin-trash": () => <AdminTrash />,
  login: () => <Login />,
  "forgot-password": () => <ForgotPassword />,
  "set-password": () => <SetPassword />,
  "link-expired": () => <LinkExpired />,
  "state-empty": () => <StateEmpty />,
  "state-loading": () => <StateLoading />,
  "state-error": () => <StateError />,
  "state-not-found": () => <StateNotFound />,
  "settings2-hub": () => <SettingsHub />,
  "settings2-account": () => <SettingsAccountV2 />,
  "settings2-security": () => <SettingsSecurityV2 />,
  "settings2-password-sheet": () => <SettingsPasswordSheet />,
  "settings2-preferences": () => <SettingsPreferencesV2 />,
};

/** Renders one mock by name (client: the mocks use click handlers). */
export function MockView({ name, icons = "sp" }: { name: string; icons?: "sp" | "lucide" }) {
  setIconSet(icons);
  const render = MOCKS[name];
  return render ? <>{render()}</> : <p>Unknown mock: {name}</p>;
}
