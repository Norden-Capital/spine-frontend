"use client";

import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  CircleCheck,
  Clock,
  KeyRound,
  Lock,
  LogIn,
  Palette,
  User,
  Bell,
  Briefcase,
  Car,
  ChevronDown,
  CloudOff,
  Copy,
  Ellipsis,
  FileText,
  Fingerprint,
  House,
  Laptop,
  LogOut,
  Mail,
  Pencil,
  Plane,
  Plus,
  Receipt,
  RotateCcw,
  ScanFace,
  Search,
  SearchX,
  Settings,
  Shield,
  ShoppingBasket,
  Smartphone,
  TextAlignStart,
  Trash2,
  UserPlus,
  Utensils,
  Wallet,
  Wifi,
  X,
} from "lucide-react";
import {
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
  TagInput,
  Timeline,
  TopBar,
  TxHero,
  type CategoryOption,
  type DockItem,
  type SignInDay,
} from "@/components/spine-ui";
import { OpenSheet } from "./client";

// Full-page mocks of the redesigned pages (dev only). Fake data.
// Each mock is the page content; the [mock] route wraps it in a themed frame.

/* ---------- shared bits ---------- */

type Tab = "home" | "expenses" | "wallet" | "settings" | "admin";

function dock(active: Tab): DockItem[] {
  const items: (DockItem & { key: Tab })[] = [
    { key: "home", href: "#home", label: "Home", icon: <House />, activeIcon: <House fill="currentColor" /> },
    { key: "expenses", href: "#expenses", label: "Expenses", icon: <ArrowLeftRight /> },
    { key: "wallet", href: "#wallet", label: "Wallet", icon: <Wallet /> },
    { key: "settings", href: "#settings", label: "Settings", icon: <Settings /> },
    { key: "admin", href: "#admin", label: "Admin", icon: <Shield /> },
  ];
  return items.map(({ key, ...i }) => ({ ...i, active: key === active }));
}

function AppTop() {
  return (
    <TopBar
      left={<IconButton label="Menu" icon={<TextAlignStart />} />}
      right={
        <>
          <IconButton label="Notifications" icon={<Bell />} dot />
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
  { id: "bills", name: "Bills", icon: <Receipt /> },
  { id: "food", name: "Food", icon: <Utensils /> },
  { id: "office", name: "Office", icon: <Briefcase /> },
  { id: "software", name: "Software", icon: <Laptop /> },
  {
    id: "transport",
    name: "Transport",
    icon: <Car />,
    children: [
      { id: "taxi", name: "Taxi" },
      { id: "fuel", name: "Fuel" },
      { id: "parking", name: "Parking" },
    ],
  },
  { id: "travel", name: "Travel", icon: <Plane /> },
  { id: "internet", name: "Internet", icon: <Wifi /> },
  { id: "other", name: "Other", icon: <Ellipsis /> },
];

const WALLET_CATS: CategoryOption[] = [
  {
    id: "food",
    name: "Food",
    icon: <ShoppingBasket />,
    children: [
      { id: "groceries", name: "Groceries" },
      { id: "restaurants", name: "Restaurants" },
    ],
  },
  { id: "bills", name: "Bills", icon: <Receipt /> },
  { id: "transport", name: "Transport", icon: <Car /> },
  { id: "other", name: "Other", icon: <Ellipsis /> },
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
        action={<IconButton label="More" icon={<Ellipsis />} variant="ghost" />}
      />
      <TxHero
        icon={<Receipt />}
        tag="Company"
        title="Hotel Rabat"
        meta="Bills · Hotels · Thu 12 Nov 2026"
        amount="-$120.00"
        kind="Expense · USD"
      />
      <div className="grid grid-cols-3 gap-[8px]">
        <SpButton size="md" icon={<Pencil />}>
          Edit
        </SpButton>
        <SpButton size="md" variant="secondary" icon={<Copy />}>
          Copy
        </SpButton>
        <SpButton size="md" variant="danger" icon={<Trash2 />}>
          Delete
        </SpButton>
      </div>
      <InfoList
        rows={[
          { label: "Category", value: "Bills › Hotels" },
          { label: "Tags", value: "#travel  #rabat" },
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
              changes: ["Category: Bills → Bills › Hotels", "Tags: added #rabat"],
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
        action={<IconButton label="More" icon={<Ellipsis />} variant="ghost" />}
      />
      <TxHero
        tone="wallet"
        icon={<ShoppingBasket />}
        tag="Personal wallet"
        title="Groceries"
        meta="Food · Groceries · Wed 11 Nov 2026"
        amount="-$50.00"
        kind="Expense · USD"
      />
      <div className="grid grid-cols-3 gap-[8px]">
        <SpButton size="md" icon={<Pencil />}>
          Edit
        </SpButton>
        <SpButton size="md" variant="secondary" icon={<Copy />}>
          Copy
        </SpButton>
        <SpButton size="md" variant="danger" icon={<Trash2 />}>
          Delete
        </SpButton>
      </div>
      <InfoList
        rows={[
          { label: "Category", value: "Food › Groceries" },
          { label: "Tags", value: "—" },
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
        action={<IconButton label="Close" icon={<X />} />}
      />
      <Segmented
        label="Type"
        value="expense"
        items={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />
      <AmountField
        id="amount"
        symbol="$"
        currencies={["USD", "MAD"]}
        currency="USD"
        placeholder="0.00"
        defaultValue={filled ? (wallet ? "50.00" : "120.00") : "120"}
      />
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
      <SpField label="Tags" htmlFor="tags" optional={wallet}>
        <TagInput
          tags={wallet ? [] : [{ id: "travel", name: "travel" }]}
          onRemove={() => {}}
          suggestions={
            wallet
              ? [
                  { id: "home", name: "home" },
                  { id: "weekly", name: "weekly" },
                ]
              : [
                  { id: "client", name: "client" },
                  { id: "rabat", name: "rabat" },
                  { id: "q4", name: "q4" },
                ]
          }
          inputProps={{ id: "tags" }}
        />
      </SpField>
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
          <ListItem icon={<Receipt />} title="Hotel Rabat" meta="Sam Tremblay • 12 Nov 2026, 02:44" amount="$120.00" href="#tx" />
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
            <SpInput id="em" surface="panel" icon={<Mail />} readOnly defaultValue="sam.tremblay@nordencapital.ca" />
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
      <SpButton className="w-full" variant="danger" icon={<LogOut />}>
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
          leading={<RowIcon><Smartphone /></RowIcon>}
          title="iPhone 15"
          subtitle="Added 2 Nov · Used today"
          trailing={<IconButton label="Options for iPhone 15" icon={<Ellipsis />} variant="ghost" />}
        />
        <SpRow
          leading={<RowIcon><Laptop /></RowIcon>}
          title="MacBook Air"
          subtitle="Added 14 Oct · Used 3 days ago"
          trailing={<IconButton label="Options for MacBook Air" icon={<Ellipsis />} variant="ghost" />}
        />
        <SpRow
          leading={<RowIcon tone="ink"><Plus /></RowIcon>}
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
            <SpButton className="w-full" variant="danger" icon={<LogOut />}>
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
          <SpInput icon={<Search />} placeholder="Search users" aria-label="Search users by name or email" />
        </div>
        <SpButton icon={<UserPlus />} className="px-[18px]">
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
        action={<IconButton label="More" icon={<Ellipsis />} variant="ghost" />}
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
        <SpRow leading={<RowIcon><Mail /></RowIcon>} title="Send the invite again" subtitle="Emma has not logged in yet." onClick={() => {}} trailing={<span />} />
        <SpRow leading={<RowIcon><LogOut /></RowIcon>} title="Log out on all devices" onClick={() => {}} trailing={<span />} />
        <SpRow
          leading={
            <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sp-danger)_14%,var(--sp-panel))] text-(--sp-danger) [&_svg]:size-[15px] [&_svg]:stroke-[1.7]">
              <X />
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
    { title: "Lunch meeting", sub: "Deleted by Adam Admin · 12 Nov", amount: "-$18.50", icon: <Utensils /> },
    { title: "Taxi to the airport", sub: "Deleted by Sam Tremblay · 10 Nov", amount: "-$54.20", icon: <Car /> },
    { title: "Printer paper", sub: "Deleted by Emma Employee · 3 Nov", amount: "-$12.00", icon: <FileText /> },
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
                <IconButton label={`Restore ${t.title}`} icon={<RotateCcw />} variant="ghost" />
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
  const more = (n: string) => <IconButton label={`Options for ${n}`} icon={<Ellipsis />} variant="ghost" />;
  return (
    <AppPage tab="admin">
      <PageHeader title="Admin" />
      <AdminTabs value="categories" />
      <Segmented
        label="Categories or tags"
        value="categories"
        items={[
          { value: "categories", label: "Categories" },
          { value: "tags", label: "Tags" },
        ]}
      />
      <SpButton className="w-full" icon={<Plus />}>
        Add category
      </SpButton>
      <RowGroup>
        <SpRow leading={<RowIcon><Receipt /></RowIcon>} title="Bills" subtitle="1 subcategory" trailing={more("Bills")} />
        <SpRow indent leading={<RowIcon><Receipt /></RowIcon>} title="Hotels" trailing={more("Hotels")} />
        <SpRow leading={<RowIcon><Utensils /></RowIcon>} title="Food" trailing={more("Food")} />
        <SpRow leading={<RowIcon><Briefcase /></RowIcon>} title="Office" trailing={more("Office")} />
        <SpRow leading={<RowIcon><Laptop /></RowIcon>} title="Software" trailing={more("Software")} />
        <SpRow leading={<RowIcon><Car /></RowIcon>} title="Transport" subtitle="3 subcategories" trailing={more("Transport")} />
        <SpRow indent leading={<RowIcon><Car /></RowIcon>} title="Taxi" trailing={more("Taxi")} />
        <SpRow indent leading={<RowIcon><Car /></RowIcon>} title="Fuel" trailing={more("Fuel")} />
        <SpRow indent leading={<RowIcon><Car /></RowIcon>} title="Parking" trailing={more("Parking")} />
        <SpRow leading={<RowIcon><Plane /></RowIcon>} title="Travel" trailing={more("Travel")} />
        <SpRow leading={<RowIcon><Ellipsis /></RowIcon>} title="Other" trailing={more("Other")} />
      </RowGroup>
      <RowGroup>
        <SpRow
          onClick={() => {}}
          leading={<RowIcon><Wifi /></RowIcon>}
          title="Archived"
          subtitle="1 category · Internet"
          muted
          trailing={<ChevronDown aria-hidden className="mr-[12px] size-[18px] stroke-[1.8] text-(--sp-text-faint)" />}
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
          <SpInput id="le" type="email" placeholder="name@nordencapital.ca" autoComplete="email" icon={<Mail />} />
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
        <SpButton className="w-full" variant="secondary" icon={<ScanFace />}>
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
          <SpInput id="fe" type="email" placeholder="name@nordencapital.ca" autoComplete="email" icon={<Mail />} />
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
        icon={<Mail />}
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
      <SpInput icon={<Search />} placeholder="Search expenses" aria-label="Search expenses" />
      <FilterChips label="Filter expenses">
        <FilterChip label="All" count={0} active />
        <FilterChip label="This month" />
        <FilterChip label="Travel" />
        <FilterChip label="Meals" />
      </FilterChips>
      <EmptyState
        framed
        icon={<Receipt />}
        title="No expenses yet"
        text="Add your first expense. Take a photo of the receipt and you are done."
        action={<SpButton icon={<Plus />}>Add expense</SpButton>}
      />
      <EmptyState
        icon={<SearchX />}
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
        icon={<CloudOff />}
        title="Something went wrong"
        text="We could not load this page. Check your connection and try again."
        action={
          <>
            <SpButton icon={<RotateCcw />}>Try again</SpButton>
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
            <SpButton icon={<House />}>Go home</SpButton>
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
        { icon: <LogIn />, tone: "violet", value: "18", label: "Sign-ins this month" },
        { icon: <Clock />, tone: "sun", value: "Today", label: "Last login, 08:12" },
        { icon: <ScanFace />, tone: "ink", value: "2", label: "Face ID devices" },
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
          leading={<IconTile tone="violet" size={44}><User /></IconTile>}
          title="My account"
          subtitle="Name, email, role, sign-ins"
        />
        <SpRow
          href="#security"
          leading={<IconTile tone="ink" size={44}><Lock /></IconTile>}
          title="Security"
          subtitle="Password, Face ID / fingerprint"
        />
        <SpRow
          href="#preferences"
          leading={<IconTile tone="sun" size={44}><Palette /></IconTile>}
          title="Preferences"
          subtitle="Theme, text size, font, dates"
        />
      </RowGroup>
      <SpButton className="w-full" variant="danger" icon={<LogOut />}>
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
            <SpInput id="em2" surface="panel" icon={<Lock />} readOnly defaultValue={PROFILE.email} />
          </SpField>
          <SpButton className="w-full" disabled>
            Save
          </SpButton>
        </div>
      </SpPanel>
      <RowGroup title="Account">
        <SpRow
          leading={<IconTile tone="violet"><Shield /></IconTile>}
          title="Role"
          trailing={<SpBadge tone="accent">Admin</SpBadge>}
          className="pr-[14px]"
        />
        <SpRow
          leading={<IconTile tone="green"><CircleCheck /></IconTile>}
          title="Status"
          trailing={<SpBadge tone="success">Active</SpBadge>}
          className="pr-[14px]"
        />
        <SpRow
          leading={<IconTile tone="sun"><CalendarDays /></IconTile>}
          title="Created"
          trailing={<span className="text-[0.75rem] font-medium text-(--sp-text)">2 Sep 2026</span>}
          className="pr-[14px]"
        />
        <SpRow
          leading={<IconTile tone="ink"><Clock /></IconTile>}
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
            <KeyRound />
          </IconTile>
          <div className="min-w-0 flex-1 pt-[4px] leading-tight">
            <h2 className="text-[0.9375rem] font-medium text-(--sp-text)">Password</h2>
            <p className="mt-[5px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
              At least 12 characters. When you change it, your other devices are logged out.
            </p>
          </div>
        </div>
        <SpButton className="mt-[16px] w-full" variant="secondary" icon={<KeyRound />}>
          Change password
        </SpButton>
      </section>
      <section className="rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[16px] pb-[16px]">
        <div className="flex items-start gap-[12px]">
          <IconTile tone="ink" size={52}>
            <ScanFace />
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
            icon={<Smartphone />}
            tone="violet"
            name="iPhone 15"
            added="2 Nov 2026"
            lastUsed="Today, 08:12"
            current
            action={<IconButton label="Options for iPhone 15" icon={<Ellipsis />} variant="ghost" />}
          />
          <DeviceCard
            icon={<Laptop />}
            tone="sun"
            name="MacBook Air"
            added="14 Oct 2026"
            lastUsed="3 days ago"
            action={<IconButton label="Options for MacBook Air" icon={<Ellipsis />} variant="ghost" />}
          />
        </div>
        <SpButton className="mt-[14px] w-full" icon={<Fingerprint />}>
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
          <p className="text-[0.625rem] leading-none text-(--sp-card-front-muted)">Today looks like this</p>
          <p className="mt-[8px] text-[1.25rem] leading-none font-medium tabular-nums">12/11/2026 · 14:05</p>
          <p className="mt-[6px] text-[0.6875rem] leading-none text-(--sp-card-front-muted)">America/Toronto (UTC−5)</p>
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
                  <Clock />
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

/* ---------- registry ---------- */

const MOCKS: Record<string, () => ReactNode> = {
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
export function MockView({ name }: { name: string }) {
  const render = MOCKS[name];
  return render ? <>{render()}</> : <p>Unknown mock: {name}</p>;
}
