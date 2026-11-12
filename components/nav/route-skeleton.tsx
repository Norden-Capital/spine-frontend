"use client";

import { createContext, use, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CardSkeleton, ListItemSkeleton, PageHeader, SectionSkeleton, SpSkeleton } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

// Loading skeletons for the app pages, in the shape of each real page.
//
// Chosen by the path we are going to, not by the loading.tsx file that
// shows it: on a link click, Next shows the loading.tsx of the closest
// folder above the new part of the URL (e.g. transactions/loading.tsx when
// opening one transaction from the list), so the file alone can not know
// which page is coming. Used by every app/(app)/**/loading.tsx and by
// AppMain (shown the moment a link is tapped).
//
// Only gray blocks and fixed titles: never data, so nothing can leak while
// the session or the wallet PIN is still being checked.

/**
 * What is already on screen above the skeleton:
 * - "app": nothing (only the top bar and dock): draw the whole page.
 * - "admin": inside that layout, its title and tabs stay: draw
 *   only the tab content.
 */
export type SkeletonScope = "app" | "settings" | "admin";

/**
 * true = the owner. Members have no Admin area, so they never get an Admin
 * skeleton (set by NavPending in the app layout).
 */
export const OwnerContext = createContext(false);

const S = SpSkeleton;

function Panel({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div aria-hidden className={cn("rounded-(--sp-radius) bg-(--sp-panel)", className)}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- parts */

/** PageHeader: optional back button, title + subtitle, optional action button. */
function PageHeadSk({ back, action }: { back?: boolean; action?: boolean }) {
  return (
    <div aria-hidden className="flex min-h-[44px] items-center gap-[12px]">
      {back ? <S className="size-[44px] shrink-0" /> : null}
      <div className="min-w-0 flex-1 space-y-[7px]">
        <S className="h-[18px] w-[140px]" />
        <S className="h-[9px] w-[90px]" />
      </div>
      {action ? <S className="size-[44px] shrink-0" /> : null}
    </div>
  );
}

/** "< Wallet" link, title, subtitle (WalletPageHead). */
function WalletHeadSk() {
  return (
    <div aria-hidden className="flex flex-col gap-1">
      <div className="flex h-11 items-center">
        <S className="h-[12px] w-[64px]" />
      </div>
      <S className="h-[22px] w-[140px]" />
      <S className="mt-[6px] h-[10px] w-[220px]" />
    </div>
  );
}

/** Kit Segmented (44 tall pill) with n tabs. */
function TabsSk({ n }: { n: number }) {
  return (
    <Panel className="flex h-[44px] gap-[2px] rounded-full p-[4px]">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex flex-1 items-center justify-center">
          <S className="h-[9px] w-[52px]" />
        </div>
      ))}
    </Panel>
  );
}

/** Two stacked cards (SwapStack: back strip 51 + front card 180), as on Home and Wallet. */
function SwapStackSk() {
  return (
    <div aria-hidden>
      <CardSkeleton className="h-[80px]" />
      <Panel className="relative -mt-[29px] h-[180px] px-[17px] pt-[20px]">
        <S className="h-[10px] w-[64px]" />
        <S className="mt-[22px] h-[9px] w-[80px]" />
        <S className="mt-[12px] h-[30px] w-[160px]" />
        <S className="absolute bottom-[8px] left-[17px] h-[9px] w-[110px]" />
        <S className="absolute right-[8px] bottom-[8px] h-[48px] w-[116px]" />
      </Panel>
    </div>
  );
}

/** QuickActionsPanel: 4 round buttons with a label. */
function QuickActionsSk() {
  return (
    <Panel className="grid h-[112px] grid-cols-4 px-[2px]">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col items-center pt-[19.5px]">
          <S className="size-[48px]" />
          <S className="mt-[11px] h-[9px] w-[36px]" />
        </div>
      ))}
    </Panel>
  );
}

/** "< Month >" switcher of the lists. */
function MonthSwitcherSk() {
  return (
    <div aria-hidden className="flex items-center justify-between">
      <S className="size-11" />
      <S className="h-[22px] w-[130px]" />
      <S className="size-11" />
    </div>
  );
}

/** FilterBar: search pill + filter button. */
function FilterBarSk() {
  return (
    <div aria-hidden className="flex gap-2">
      <Panel className="flex h-12 flex-1 items-center rounded-full pl-4">
        <S className="h-[10px] w-[120px]" />
      </Panel>
      <Panel className="size-12 shrink-0 rounded-full" />
    </div>
  );
}

/** TxList: totals panel + days with rows. */
function TxListSk() {
  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex items-center justify-between px-[14px] py-[16px]">
        <S className="h-[10px] w-[150px]" />
        <S className="h-[16px] w-[80px]" />
      </Panel>
      {[4, 3].map((rows, i) => (
        <Panel key={i} className="pt-2 pb-2">
          <div className="px-[14px] pt-[10px] pb-[10px]">
            <S className="h-[9px] w-[70px]" />
          </div>
          {Array.from({ length: rows }, (_, j) => (
            <ListItemSkeleton key={j} />
          ))}
        </Panel>
      ))}
    </div>
  );
}

/** A panel of plain rows (alerts, users, trash, managers). */
function RowsSk({ rows, title }: { rows: number; title?: boolean }) {
  if (title) return <SectionSkeleton rows={rows} />;
  return (
    <Panel className="py-[6px]">
      {Array.from({ length: rows }, (_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </Panel>
  );
}

/** InfoList: label left, value right, 44 per row. */
function InfoListSk({ rows, title }: { rows: number; title?: boolean }) {
  return (
    <Panel className="px-[14px] py-[6px]">
      {title ? <S className="mt-[12px] mb-[4px] h-[11px] w-[70px]" /> : null}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-[44px] items-center justify-between gap-[16px] py-[8px]">
          <S className="h-[9px] w-[70px]" />
          <S className="h-[10px] w-[110px]" />
        </div>
      ))}
    </Panel>
  );
}

/** SpPanel: title, then its content. */
function SpPanelSk({ children, description }: { children?: ReactNode; description?: boolean }) {
  return (
    <Panel className="px-[14px] py-[16px]">
      <div className="mb-[14px] space-y-[7px]">
        <S className="h-[11px] w-[90px]" />
        {description ? <S className="h-[9px] w-[220px]" /> : null}
      </div>
      {children}
    </Panel>
  );
}

/** SpField + SpInput: label, then a 52 tall input. */
function FieldSk({ label = "w-[80px]", soft }: { label?: string; soft?: boolean }) {
  return (
    <div aria-hidden className="space-y-[8px]">
      <S className={cn("ml-[4px] h-[11px]", label)} />
      <div
        className={cn(
          "h-[52px] rounded-[16px]",
          soft ? "bg-[color-mix(in_oklab,var(--sp-text)_5%,transparent)]" : "bg-(--sp-panel)"
        )}
      />
    </div>
  );
}

function LinesSk({ n }: { n: number }) {
  return (
    <div className="space-y-[10px]">
      {Array.from({ length: n }, (_, i) => (
        <S key={i} className={cn("h-[10px]", i % 2 ? "w-[55%]" : "w-[80%]")} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- pages */

/** Company home: header + search, two cards, quick actions, recent. */
function HomeSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeadSk action />
      <SwapStackSk />
      <QuickActionsSk />
      <SectionSkeleton rows={5} />
    </div>
  );
}

function TxListPageSk({ wallet }: { wallet?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {wallet ? (
        <div aria-hidden className="flex h-11 items-center">
          <S className="h-[12px] w-[64px]" />
        </div>
      ) : null}
      <MonthSwitcherSk />
      <FilterBarSk />
      <TxListSk />
    </div>
  );
}

/** One transaction: header, hero card, Edit/Copy/Delete, details, panels. */
function TxDetailSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeadSk back />
      <CardSkeleton />
      <div aria-hidden className="grid grid-cols-3 gap-[8px]">
        <S className="h-[44px]" />
        <S className="h-[44px]" />
        <S className="h-[44px]" />
      </div>
      <InfoListSk rows={3} />
      <SpPanelSk>
        <div className="flex gap-[8px]">
          <S className="size-[72px] rounded-[14px]" />
          <S className="size-[72px] rounded-[14px]" />
        </div>
      </SpPanelSk>
      <SpPanelSk>
        <LinesSk n={2} />
      </SpPanelSk>
    </div>
  );
}

/** Add / edit form: no dock, Save button at the bottom. */
function TxFormSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeadSk action />
      <TabsSk n={2} />
      <Panel className="h-[112px] px-[16px] pt-[16px]">
        <S className="h-[10px] w-[60px]" />
        <S className="mt-[22px] h-[36px] w-[160px]" />
      </Panel>
      <FieldSk label="w-[40px]" />
      <FieldSk label="w-[90px]" />
      <div aria-hidden className="space-y-[8px]">
        <S className="ml-[4px] h-[11px] w-[70px]" />
        <Panel className="h-[120px] rounded-[16px]" />
      </div>
      <FieldSk label="w-[44px]" />
      <S className="mt-[8px] h-[52px] w-full" />
    </div>
  );
}

function AlertsSk() {
  return (
    <div className="flex flex-col gap-4">
      <div aria-hidden className="flex min-h-11 items-center">
        <S className="h-[22px] w-[80px]" />
      </div>
      <RowsSk rows={6} />
    </div>
  );
}

/** Wallet: header + lock, two cards, quick actions, budgets, recent. */
function WalletHomeSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeadSk action />
      <SwapStackSk />
      <QuickActionsSk />
      <SectionSkeleton rows={3} />
      <SectionSkeleton rows={3} />
    </div>
  );
}

/** Budgets / goals / recurring: "< Wallet" head + the list. */
function WalletManagerSk() {
  return (
    <div className="flex flex-col gap-4">
      <WalletHeadSk />
      <S className="h-[52px] w-full" />
      <RowsSk rows={4} />
    </div>
  );
}

function CatalogSk({ wallet }: { wallet?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {wallet ? <WalletHeadSk /> : null}
      <S className="h-[52px] w-full" />
      <RowsSk rows={6} />
    </div>
  );
}

/** Settings hub: profile card, 3 stat tiles, 3 entries, Log out. */
function SettingsHubSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <S className="h-[120px] w-full rounded-(--sp-radius)" />
      <div className="grid grid-cols-3 gap-[8px]">
        {[0, 1, 2].map((i) => (
          <S key={i} className="h-[76px] rounded-[18px]" />
        ))}
      </div>
      <RowsSk rows={3} />
      <S className="h-[52px] w-full rounded-full" />
    </div>
  );
}

function SettingsTabSk({ tab }: { tab: string }) {
  if (tab === "security") {
    return (
      <>
        <SpPanelSk description>
          <div className="space-y-[14px]">
            <FieldSk soft />
            <FieldSk soft />
            <S className="h-[52px] w-full" />
          </div>
        </SpPanelSk>
        <SpPanelSk description>
          <RowsSk rows={2} />
        </SpPanelSk>
      </>
    );
  }
  if (tab === "preferences") {
    return (
      <>
        {[3, 4, 2].map((n, i) => (
          <SpPanelSk key={i}>
            <div className="grid grid-cols-3 gap-[8px]">
              {Array.from({ length: n }, (_, j) => (
                <S key={j} className="h-[72px] rounded-[16px]" />
              ))}
            </div>
          </SpPanelSk>
        ))}
      </>
    );
  }
  // account
  return (
    <>
      <SpPanelSk>
        <div className="space-y-[14px]">
          <FieldSk soft />
          <FieldSk soft />
          <FieldSk soft />
        </div>
      </SpPanelSk>
      <InfoListSk rows={4} title />
      <SpPanelSk>
        <S className="h-[140px] w-full rounded-[16px]" />
      </SpPanelSk>
      <S className="h-[52px] w-full" />
    </>
  );
}

function AdminTabSk({ tab }: { tab: string }) {
  if (tab === "categories") return <CatalogSk />;
  if (tab === "trash") return <RowsSk rows={5} />;
  // users
  return (
    <>
      <div aria-hidden className="flex gap-[8px]">
        <Panel className="h-[52px] flex-1 rounded-[16px]" />
        <S className="h-[52px] w-[104px]" />
      </div>
      <RowsSk rows={6} />
    </>
  );
}

/** One user (admin): own header with back, badges, details, sign-ins, actions. */
function AdminUserSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeadSk back />
      <div aria-hidden className="flex gap-[6px] px-[2px]">
        <S className="h-[22px] w-[64px]" />
        <S className="h-[22px] w-[64px]" />
      </div>
      <InfoListSk rows={4} />
      <SpPanelSk>
        <S className="h-[140px] w-full rounded-[16px]" />
      </SpPanelSk>
      <S className="h-[52px] w-full" />
    </div>
  );
}

/** Company repeat expenses: header, add button, rows with their buttons. */
function RecurringSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeadSk />
      <S className="h-[52px] w-full" />
      {[0, 1, 2].map((i) => (
        <Panel key={i} className="flex flex-col gap-[12px] p-[14px]">
          <div className="flex items-start gap-[10.8px]">
            <S className="size-[40px] shrink-0" />
            <div className="min-w-0 flex-1 space-y-[7px] pt-[4px]">
              <S className="h-[11px] w-[130px]" />
              <S className="h-[9px] w-[160px]" />
            </div>
            <S className="h-[14px] w-[64px]" />
          </div>
          <div className="grid grid-cols-3 gap-[8px]">
            <S className="h-[44px]" />
            <S className="h-[44px]" />
            <S className="h-[44px]" />
          </div>
        </Panel>
      ))}
    </div>
  );
}

/** One reminder: header with back, hero, details, two buttons. */
function DueReminderSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeadSk back />
      <Panel className="flex flex-col items-center gap-[12px] px-[16px] py-[22px]">
        <S className="size-[48px]" />
        <S className="h-[11px] w-[140px]" />
        <S className="h-[28px] w-[120px]" />
        <S className="h-[22px] w-[60px]" />
      </Panel>
      <InfoListSk rows={3} />
      <S className="h-[52px] w-full" />
      <S className="h-[52px] w-full" />
    </div>
  );
}

/** Used when no page matches (a new page without its own skeleton yet). */
function GenericSk() {
  return (
    <div className="flex flex-col gap-[16px]">
      <div aria-hidden className="space-y-[10px] pt-[6px]">
        <S className="h-[26px] w-[180px]" />
        <S className="h-[10px] w-[150px]" />
      </div>
      <SectionSkeleton rows={4} />
      <SectionSkeleton rows={3} />
    </div>
  );
}

/* ---------------------------------------------------------------- routing */

/** The skeleton for a path, or null if this path has none. */
function skeletonFor(pathname: string, scope: SkeletonScope, owner: boolean): ReactNode {
  const p = pathname.replace(/\/+$/, "") || "/";
  let m: RegExpMatchArray | null;

  if (p === "/") return <HomeSk />;
  if (p === "/alerts") return <AlertsSk />;

  if (p === "/transactions") return <TxListPageSk />;
  if (p === "/wallet/transactions") return <TxListPageSk wallet />;
  if (/^\/(wallet\/)?transactions\/(new|[^/]+\/edit)$/.test(p)) return <TxFormSk />;
  if (/^\/(wallet\/)?transactions\/[^/]+$/.test(p)) return <TxDetailSk />;

  if (p === "/wallet") return <WalletHomeSk />;
  if (/^\/wallet\/(budgets|goals|recurring)$/.test(p)) return <WalletManagerSk />;
  if (p === "/wallet/categories") return <CatalogSk wallet />;

  if (p === "/recurring") return <RecurringSk />;
  if (/^\/recurring\/due\/[^/]+$/.test(p)) return <DueReminderSk />;

  // Settings v2: the layout has no title or tabs; each page draws its own header.
  if (p === "/settings") return <SettingsHubSk />;
  if ((m = p.match(/^\/settings\/(account|security|preferences)$/))) {
    return (
      <div className="flex flex-col gap-[16px]">
        <PageHeadSk back />
        <SettingsTabSk tab={m[1]} />
      </div>
    );
  }

  // Admin area: the owner only.
  if (!owner) return null;
  if (/^\/admin\/users\/[^/]+$/.test(p)) return <AdminUserSk />;
  if ((m = p.match(/^\/admin\/(users|categories|trash)$/))) {
    const tab = <AdminTabSk tab={m[1]} />;
    if (scope === "admin") return tab;
    return (
      <div className="flex flex-col gap-[16px]">
        <PageHeader title="Admin" />
        <TabsSk n={3} />
        {tab}
      </div>
    );
  }
  return null;
}

/** True if this path has its own skeleton (AppMain only shows those on a tap). */
export function hasSkeleton(pathname: string, owner: boolean): boolean {
  return skeletonFor(pathname, "app", owner) !== null;
}

/**
 * The loading skeleton of a page. `path`: the page to draw (default: the
 * current URL, which during a navigation is already the new one).
 */
export function RouteSkeleton({ scope = "app", path }: { scope?: SkeletonScope; path?: string }) {
  const pathname = usePathname();
  const owner = use(OwnerContext);
  const body = skeletonFor(path ?? pathname, scope, owner) ?? <GenericSk />;
  // Settings / admin content sits in their layout's flex column (gap 16):
  // keep that gap between the skeleton's parts too.
  const inLayout = scope !== "app";
  return (
    <div role="status" aria-busy="true" className={inLayout ? "flex flex-col gap-[16px]" : undefined}>
      <span className="sr-only">Loading…</span>
      {body}
    </div>
  );
}
