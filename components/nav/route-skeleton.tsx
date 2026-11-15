"use client";

import { createContext, use, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CardSkeleton, ListItemSkeleton, PageHeader } from "@/components/spine-ui";
import { cn } from "@/lib/utils";
import {
  ButtonSk,
  FieldSk,
  FS,
  GhostIconSk,
  InfoListSk,
  InputSk,
  LH,
  Lines,
  PageHeadSk,
  Panel,
  RoundSk,
  RowGroupSk,
  S,
  SectionCardSk,
  SignInActivitySkeleton,
  SignInHeatmapSkeleton,
  SpPanelSk,
  SpRowSk,
  StatTilesSk,
  TabsSk,
  TileSk,
  TimelineSk,
} from "./skeleton-parts";

// Loading skeletons for the app pages, in the shape of each real page:
// same header, same panels, same row heights and gaps, gray blocks where
// the text goes, so nothing jumps when the page comes.
//
// Chosen by the path we are going to, not by the loading.tsx file that
// shows it: on a link click, Next shows the loading.tsx of the closest
// folder above the new part of the URL (e.g. transactions/loading.tsx when
// opening one transaction from the list), so the file alone can not know
// which page is coming. Used by every app/(app)/**/loading.tsx and by
// AppMain (shown the moment a link is tapped), so both always agree.
//
// Only gray blocks and fixed titles: never data, so nothing can leak while
// the session or the wallet PIN is still being checked.
//
// When a page changes, change its skeleton here too (the parts are in
// ./skeleton-parts.tsx, one per kit part).

/**
 * What is already on screen above the skeleton:
 * - "app": nothing (only the top bar and dock): draw the whole page.
 * - "settings": inside its layout (a 16 gap column, no title): the whole page.
 * - "admin": inside that layout, its title and tabs stay: draw
 *   only the tab content.
 */
export type SkeletonScope = "app" | "settings" | "admin";

/**
 * true = the owner. Members have no Admin area, so they never get an Admin
 * skeleton (set by NavPending in the app layout).
 */
export const OwnerContext = createContext(false);

/** A 16 gap column, like the pages. */
function Col({ gap = 16, children }: { gap?: 12 | 16; children: ReactNode }) {
  return <div className={cn("flex flex-col", gap === 12 ? "gap-[12px]" : "gap-[16px]")}>{children}</div>;
}

/* ---------------------------------------------------------------- parts */

/** Inverse corner of BalanceCard's cut-out (page color outside a 16 circle). */
const INVERSE_CORNER =
  "pointer-events-none absolute size-[16px] bg-[radial-gradient(circle_at_0_0,transparent_15.5px,var(--sp-bg)_16px)]";

/**
 * Kit BalanceCard (180): tag, label, big amount, detail on the right,
 * footer, and the cut-out corner with its 116 × 48 pill when `action`.
 */
function BalanceCardSk({ action = true, detail = true }: { action?: boolean; detail?: boolean }) {
  return (
    <Panel className="relative h-[180px]">
      <S className="absolute top-[17px] left-[16px] size-[26px]" />
      <Lines fs="13px" trim={0.25} w={64} className="absolute top-[21px] right-[18px]" />
      <Lines fs="12px" trim={0.25} w={80} className="absolute top-[60px] left-[17px]" />
      <Lines fs={FS.t34} trim={0.25} w={150} bar={0.6} className="absolute top-[77px] left-[16px]" />
      {detail ? (
        <div className="absolute top-[76px] right-[18px] flex flex-col items-end">
          <Lines fs="10px" trim={0.25} w={36} />
          <Lines fs="14.5px" trim={0.25} mt="3.5px" w={64} />
        </div>
      ) : null}
      <div className={cn("absolute top-[132px] left-[17px]", action ? "right-[150px]" : "right-[18px]")}>
        <Lines fs="12px" trim={0.25} w={48} />
        <Lines fs="14.5px" trim={0.25} mt="5px" w={action ? "90%" : 140} />
      </div>
      {action ? (
        <div className="absolute right-0 bottom-0 rounded-tl-[16px] bg-(--sp-bg) pt-[6px] pl-[6px]">
          <span aria-hidden className={cn(INVERSE_CORNER, "right-0 bottom-full")} />
          <span aria-hidden className={cn(INVERSE_CORNER, "right-full bottom-0")} />
          <S className="h-[48px] w-[116px]" />
        </div>
      ) : null}
    </Panel>
  );
}

/** SwapStack: the back card's 51 strip, the front BalanceCard 51 lower (231 in all). */
function SwapStackSk() {
  return (
    <div aria-hidden className="relative h-[231px]">
      <CardSkeleton className="absolute inset-x-0 top-0 h-[80px]" />
      <div className="absolute inset-x-0 top-[51px]">
        <BalanceCardSk />
      </div>
    </div>
  );
}

/** QuickActionsPanel: 4 round 48 buttons with a label (112+). */
function QuickActionsSk() {
  return (
    <Panel className="grid min-h-[112px] grid-cols-4 px-[2px]">
      {[44, 30, 52, 40].map((w, i) => (
        <div key={i} className="flex flex-col items-center pt-[17.7px] pb-[18.2px]">
          <RoundSk size={48} />
          <Lines fs={FS.t12} center w={w} className="mt-[11.2px] w-full" />
        </div>
      ))}
    </Panel>
  );
}

/** Kit PeriodBar (‹ Month ›, summary line) + SearchBar (input + 52 filter button). */
function FilterBarSk() {
  return (
    <div aria-hidden className="flex flex-col gap-[12px]">
      <div className="flex min-h-[52px] items-center gap-[8px]">
        <RoundSk />
        <div className="flex min-w-0 flex-1 flex-col items-center px-[8px] py-[2px]">
          <Lines fs={FS.t16} trim={0.125} center w={130} className="w-full" />
          <Lines fs={FS.t11} trim={0.125} mt="3px" center w={170} className="w-full" />
        </div>
        <RoundSk />
      </div>
      <div className="flex gap-[8px]">
        <InputSk icon w={130} className="min-w-0 flex-1" />
        <span className="size-[52px] shrink-0 rounded-full bg-(--sp-input)" />
      </div>
    </div>
  );
}

/** TxList: one panel per day (day name, then 48 rows). */
function TxListSk() {
  return (
    <div className="flex flex-col gap-4">
      {[4, 3].map((rows, i) => (
        <Panel key={i} className="pt-2 pb-2">
          <div className="px-[14px] pt-[8px] pb-[4px]">
            <Lines fs={FS.t11} lh={LH.snug} w={90} />
          </div>
          {Array.from({ length: rows }, (_, j) => (
            <ListItemSkeleton key={j} />
          ))}
        </Panel>
      ))}
    </div>
  );
}

/** TxHero: icon + tag, title, meta, big amount + kind. */
function TxHeroSk() {
  return (
    <Panel className="px-[17px] pt-[16px] pb-[20px]">
      <div className="flex items-center justify-between gap-3">
        <RoundSk />
        <Lines fs={FS.t13} w={70} />
      </div>
      <Lines fs={FS.t15} lh={LH.snug} w="55%" className="mt-[18px]" />
      <Lines fs={FS.t12} lh={LH.snug} w="40%" className="mt-[4px]" />
      <div className="mt-[14px] flex items-end justify-between gap-3">
        <Lines fs="34px" trim={0.25} w={150} bar={0.6} />
        <Lines fs={FS.t12} trim={0.25} w={48} className="pb-[4px]" />
      </div>
    </Panel>
  );
}

/** Kit AmountField with − / + (136): label row, then 48 · amount · 48. */
function AmountFieldSk() {
  return (
    <Panel className="px-[16px] pt-[14px] pb-[18px]">
      <div className="flex min-h-[36px] items-center">
        <Lines fs={FS.t13} w={56} />
      </div>
      <div className="mt-[16px] grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-[8px]">
        <RoundSk size={48} />
        <Lines fs="2.5rem" lh={1.3} center w={120} bar={0.6} />
        <RoundSk size={48} />
      </div>
    </Panel>
  );
}

/** Kit CategoryGrid: title, 4 columns of 48 circles with a name. */
function CategoryGridSk() {
  return (
    <Panel className="px-[6px] pt-[14px] pb-[14px]">
      <Lines fs={FS.t13} trim={0.25} w={70} className="px-[10px]" />
      <div className="mt-[14px] grid grid-cols-4 gap-y-[14px]">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-[8px] py-[2px]">
            <RoundSk size={48} />
            <Lines fs={FS.t11} trim={0.25} center w={[44, 36, 52, 40][i % 4]} className="w-full" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** ProofPicker: "Take a photo" / "Upload a file", two 56 soft buttons. */
function ProofPickerSk() {
  return (
    <div className="grid grid-cols-2 gap-[10px]">
      {[0, 1].map((i) => (
        <div key={i} className="flex min-h-[56px] items-center justify-center gap-[10px] rounded-[16px] bg-(--sp-panel) px-[12px] py-[8px]">
          <RoundSk size={36} />
          <Lines fs={FS.t13} lh={LH.snug} w={70} />
        </div>
      ))}
    </div>
  );
}

/** Forms have no dock: the main button(s) in the bottom bar (pt 20, pb 12). */
function FormBarSk({ cancel }: { cancel?: boolean }) {
  return (
    <div className="pt-[20px] pb-[calc(env(safe-area-inset-bottom)+12px)]">
      {cancel ? (
        <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
          <ButtonSk />
          <ButtonSk />
        </div>
      ) : (
        <ButtonSk />
      )}
    </div>
  );
}

/** BalanceRow: logo 40, name + guess, bar 6, date line + status. */
function BalanceRowSk() {
  return (
    <div className="flex gap-[12px] px-[10px] py-[10px]">
      <RoundSk size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-[10px]">
          <Lines fs={FS.t13} w={110} />
          <Lines fs={FS.t13} w={64} />
        </div>
        <S className="mt-[6px] h-[6px] w-full" />
        <div className="mt-[7px] flex items-start justify-between gap-[8px]">
          <Lines fs={FS.t11} lh={LH.snug} w={140} />
          <Lines fs={FS.t10} w={48} />
        </div>
      </div>
    </div>
  );
}

/** RepeatRow: logo 40, name + amount, "Every … · next …", "…" button. */
function RepeatRowSk() {
  return (
    <div className="flex flex-col gap-[12px] rounded-(--sp-radius) bg-(--sp-panel) py-[12px] pr-[6px] pl-[14px]">
      <div className="flex items-start gap-[10.8px]">
        <RoundSk size={40} className="mt-[2px]" />
        <div className="min-w-0 flex-1 pt-[2px]">
          <div className="flex items-center gap-[8px]">
            <Lines fs={FS.t14} w="60%" className="min-w-0 flex-1" />
            <Lines fs={FS.t14} lh={LH.snug} w={64} className="shrink-0" />
          </div>
          <Lines fs={FS.t11} w={150} className="mt-[6px]" />
        </div>
        <GhostIconSk className="-mt-[4px]" />
      </div>
    </div>
  );
}

/** "Grip" button on a sortable card / row (32 or 44 wide, 44 tall). */
function GripSk({ w = 32, className }: { w?: 32 | 44; className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-[44px] shrink-0 items-center justify-center", className)} style={{ width: w }}>
      <S className="h-[18px] w-[12px] rounded-[4px]" />
    </span>
  );
}

/** ProfileHero: the yellow back strip (64) and the purple card 42 over it. */
function ProfileHeroSk() {
  return (
    <div aria-hidden className="relative">
      <CardSkeleton className="h-[64px]" />
      <Panel className="relative -mt-[42px] px-[17px] pt-[18px] pb-[18px]">
        <div className="flex items-start justify-between gap-3">
          <RoundSk size={64} />
          <span className="flex h-[26px] items-center">
            <S className="h-[8px] w-[44px]" />
          </span>
        </div>
        <Lines fs={FS.t20} trim={0.125} mt="16px" w={150} />
        <Lines fs={FS.t12} trim={0.125} mt="3px" w={180} />
        <Lines fs={FS.t11} trim={0.25} mt="16px" w={170} />
      </Panel>
    </div>
  );
}

/** "Password" / "Face ID" panel head: tile 52, title 15, gray text. */
function SecurityHeadSk({ lines }: { lines: number }) {
  return (
    <div className="flex items-start gap-[12px]">
      <TileSk size={52} />
      <div className="min-w-0 flex-1 pt-[4px]">
        <Lines fs={FS.t15} lh={LH.snug} w={110} />
        <Lines fs={FS.t11} lh={LH.snug} n={lines} w={["95%", "60%"]} className="mt-[5px]" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- pages */

/** Company home: header + search, two cards, quick actions, balances, recent. */
function HomeSk() {
  return (
    <Col>
      <PageHeadSk title={110} sub={190} actions={[44]} />
      <SwapStackSk />
      <QuickActionsSk />
      {/* Balances card (shows when the company has balances). */}
      <SectionCardSk title={64} action={36}>
        <div className="px-[4px] pb-[6px]">
          <Lines fs={FS.t11} lh={LH.snug} w={170} className="px-[10px] pb-[4px]" />
          <BalanceRowSk />
          <BalanceRowSk />
        </div>
      </SectionCardSk>
      <SectionCardSk title={50}>
        {Array.from({ length: 5 }, (_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </SectionCardSk>
    </Col>
  );
}

/** Expenses / wallet transactions: header, period + search, days. */
function TxListPageSk({ wallet }: { wallet?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {wallet ? (
        <PageHeadSk back title={180} sub={110} actions={[44]} />
      ) : (
        <PageHeadSk title={100} sub={60} actions={[44, 44]} />
      )}
      <FilterBarSk />
      <TxListSk />
    </div>
  );
}

/** One company transaction: header, hero, Edit / Copy / Share / Delete, details, proof, comments, history. */
function TxDetailSk() {
  return (
    <Col>
      <PageHeadSk back title={90} sub={60} />
      <TxHeroSk />
      <div aria-hidden className="grid grid-cols-2 gap-[8px]">
        {[0, 1, 2, 3].map((i) => (
          <S key={i} className="h-[44px]" />
        ))}
      </div>
      <InfoListSk rows={2} />
      <SpPanelSk title={44}>
        <div className="flex min-h-[64px] items-center gap-[12px] rounded-[16px] bg-(--sp-soft) py-[8px] pr-[10px] pl-[8px]">
          <S className="size-[48px] shrink-0 rounded-[10px]" />
          <div className="min-w-0 flex-1">
            <Lines fs={FS.t13} w="55%" />
            <Lines fs={FS.t11} w="25%" />
          </div>
        </div>
      </SpPanelSk>
      <SpPanelSk title={76}>
        <Lines fs={FS.t12} w={110} />
        <div className="mt-[14px] flex items-center gap-[8px]">
          <InputSk h={44} className="min-w-0 flex-1" />
          <RoundSk />
        </div>
      </SpPanelSk>
      <SpPanelSk title={56}>
        <TimelineSk />
      </SpPanelSk>
    </Col>
  );
}

/** One wallet transaction: header, yellow hero, Edit / Copy / Delete, details, history. */
function WalletTxDetailSk() {
  return (
    <Col>
      <PageHeadSk back title={160} sub={130} />
      <TxHeroSk />
      <div aria-hidden className="grid grid-cols-3 gap-[8px]">
        {[0, 1, 2].map((i) => (
          <S key={i} className="h-[44px]" />
        ))}
      </div>
      <InfoListSk rows={2} />
      <SpPanelSk title={56}>
        <TimelineSk n={1} kit />
      </SpPanelSk>
    </Col>
  );
}

/** Add / edit a transaction (company or wallet): no dock, the button bar at the bottom. */
function TxFormSk({ wallet, edit }: { wallet?: boolean; edit?: boolean }) {
  return (
    <Col>
      <PageHeadSk title={150} sub={wallet ? 160 : 60} actions={[44]} />
      <div className="flex flex-col gap-[16px]">
        <TabsSk n={2} />
        {wallet ? <TabsSk n={2} widths={[56]} /> : null}
        <AmountFieldSk />
        <FieldSk label={36} />
        <FieldSk label={84} />
        <FieldSk label={110} hint={1} />
        <CategoryGridSk />
        <FieldSk label={wallet ? 110 : 44}>
          <ProofPickerSk />
        </FieldSk>
        <FormBarSk cancel={edit} />
      </div>
    </Col>
  );
}

/** Alerts: title (+ Mark all read), then "Latest" with alert rows. */
function AlertsSk() {
  return (
    <div className="flex flex-col gap-4">
      <div aria-hidden className="flex min-h-[44px] items-center justify-between gap-[12px]">
        <Lines fs={FS.t22} lh={LH.snug} w={80} bar={0.6} />
        <S className="h-[44px] w-[148px]" />
      </div>
      <SectionCardSk title={50} action={0}>
        {[2, 1, 2, 2, 1, 2].map((lines, i) => (
          <div key={i} className="flex min-h-[48px] items-start pr-[12px] pb-[7.5px] pl-[14px]">
            <RoundSk size={33} className="mt-[7.5px]" />
            <div className="mt-[10.5px] ml-[10.8px] min-w-0 flex-1">
              <Lines fs="12px" trim={0.25} w="60%" />
              <Lines fs="10px" n={lines} w={["90%", "55%"]} mt="calc(3.9px - 0.75px)" />
            </div>
            <div className="mt-[12px] ml-3 flex shrink-0 flex-col items-end gap-[6px]">
              <Lines fs="10px" trim={0.25} w={40} />
              {i < 2 ? <S className="size-[7px]" /> : null}
            </div>
          </div>
        ))}
      </SectionCardSk>
    </div>
  );
}

/** Wallet: header (MAD/USD pill + lock), two cards, quick actions, budgets, recent, Categories. */
function WalletHomeSk() {
  return (
    <Col>
      <PageHeadSk title={90} sub={130} actions={[86, 44]} />
      <SwapStackSk />
      <QuickActionsSk />
      <SectionCardSk title={130}>
        <div className="flex flex-col gap-4 px-[14px] pb-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-[6px]">
              <div className="flex items-center justify-between gap-[8px]">
                <Lines fs={FS.t12} lh={LH.snug} w={[90, 70, 110][i]} />
                <Lines fs={FS.t12} lh={LH.snug} w={110} />
              </div>
              <S className="h-[8px] w-full" />
            </div>
          ))}
        </div>
      </SectionCardSk>
      <SectionCardSk title={50}>
        {Array.from({ length: 5 }, (_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </SectionCardSk>
      <div aria-hidden className="flex justify-center">
        <S className="h-[44px] w-[136px]" />
      </div>
    </Col>
  );
}

/** WalletPageHead: back + title, then the gray sentence under it (`lines`). */
function WalletPageHeadSk({ title, lines }: { title: number; lines: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-[8px]">
      <PageHeadSk back title={title} />
      <Lines fs={FS.t13} lh={LH.snug} n={lines} w={["92%", "55%"]} className="px-[4px]" />
    </div>
  );
}

/** Wallet budgets: add button, cards with grip, icon, name, Edit / Remove, bar, status. */
function BudgetsSk() {
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHeadSk title={90} lines={1} />
      <Col gap={12}>
        <ButtonSk />
        {[0, 1, 2].map((i) => (
          <Panel key={i} className="flex flex-col gap-[12px] pt-[10px] pr-[8px] pb-[16px] pl-[14px]">
            <div className="flex items-center gap-[10.8px]">
              <GripSk className="-ml-[8px]" />
              <RoundSk size={33} />
              <div className="min-w-0 flex-1">
                <Lines fs={FS.t15} w="55%" />
                <Lines fs={FS.t11} lh={LH.snug} w="85%" className="mt-[2px]" />
              </div>
              <GhostIconSk />
              <GhostIconSk />
            </div>
            <div className="pr-[6px]">
              <S className="h-[8px] w-full" />
            </div>
            <Lines fs={FS.t11} lh={LH.snug} w={64} />
          </Panel>
        ))}
      </Col>
    </div>
  );
}

/** Wallet goals: add button, cards with grip, icon, name + money line, chevron, bar. */
function GoalsSk() {
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHeadSk title={70} lines={2} />
      <Col gap={12}>
        <ButtonSk />
        {[0, 1, 2].map((i) => (
          <Panel key={i} className="flex flex-col gap-[14px] px-[14px] pt-[10px] pb-[16px]">
            <div className="flex min-h-[52px] items-center gap-[2px]">
              <GripSk className="-ml-[8px]" />
              <div className="-mr-[6px] flex min-h-[52px] min-w-0 flex-1 items-center gap-[10.8px] px-[6px] py-[4px]">
                <RoundSk size={33} />
                <div className="min-w-0 flex-1">
                  <Lines fs={FS.t15} w="50%" />
                  <Lines fs={FS.t11} lh={LH.snug} w="80%" className="mt-[2px]" />
                </div>
                <S className="size-[18px] shrink-0" />
              </div>
            </div>
            <S className="h-[8px] w-full" />
            {/* The first goal opens by itself: "… to go.", Add / Take out, Edit / Remove. */}
            {i === 0 ? (
              <div className="flex flex-col gap-[14px] border-t border-(--sp-soft) pt-[14px]">
                <Lines fs={FS.t13} lh={LH.snug} w={110} className="px-[4px]" />
                <div className="flex flex-col gap-[8px]">
                  <ButtonSk />
                  <ButtonSk h={44} />
                </div>
                <div className="grid grid-cols-2 gap-[8px]">
                  <ButtonSk h={44} />
                  <ButtonSk h={44} />
                </div>
              </div>
            ) : null}
          </Panel>
        ))}
      </Col>
    </div>
  );
}

/** Wallet recurring: add button, then RepeatRows. */
function WalletRecurringSk() {
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHeadSk title={100} lines={2} />
      <Col>
        <ButtonSk />
        <Col gap={12}>
          {[0, 1, 2, 3].map((i) => (
            <RepeatRowSk key={i} />
          ))}
        </Col>
      </Col>
    </div>
  );
}

/** CatalogAdmin: Expense / Income tabs, add button, rows with grip, icon, name, "…". */
function CatalogSk() {
  return (
    <Col>
      <TabsSk n={2} />
      <ButtonSk />
      <RowGroupSk>
        {Array.from({ length: 7 }, (_, i) => (
          <SpRowSk
            key={i}
            className={i === 1 || i === 2 ? "pl-[46px]" : "pl-[2px]"}
            lead={
              <span className="flex shrink-0 items-center">
                <GripSk w={44} />
                <RoundSk size={33} />
              </span>
            }
            title={[110, 90, 120, 80, 100, 70, 96][i]}
            sub={i === 0 ? "text" : undefined}
            subW={100}
            trailing={<GhostIconSk />}
          />
        ))}
      </RowGroupSk>
    </Col>
  );
}

/** Settings hub: title, profile card, 3 tiles, 4 entries, Log out. */
function SettingsHubSk() {
  return (
    <Col>
      <PageHeadSk title={100} />
      <ProfileHeroSk />
      <StatTilesSk />
      <RowGroupSk>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} aria-hidden className="flex min-h-[60px] items-center gap-[10.8px] py-[8px] pr-[8px] pl-[14px]">
            <TileSk size={44} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center" style={{ height: `calc(${FS.t15} * 1.5 - ${FS.t13} * 0.25)` }}>
                <S style={{ width: [90, 100, 70, 96][i], height: `calc(${FS.t15} * 0.7)` }} />
              </span>
              <Lines fs={FS.t12} w={[160, 120, 180, 170][i]} className="mt-[3px]" />
            </span>
            <S className="size-[14px] shrink-0" />
          </div>
        ))}
      </RowGroupSk>
      <ButtonSk />
    </Col>
  );
}

/** One Settings subpage (each draws its own header with a back button). */
function SettingsTabSk({ tab }: { tab: string }) {
  if (tab === "notifications") {
    return (
      <Col>
        <PageHeadSk back title={130} />
        <SpPanelSk title={0}>
          <div className="flex items-center gap-[12px]">
            <TileSk size={44} />
            <div className="min-w-0 flex-1">
              <Lines fs={FS.t15} lh={LH.snug} w={100} />
              <Lines fs={FS.t12} lh={LH.snug} w={40} className="mt-[2px]" />
            </div>
          </div>
          <Lines fs={FS.t12} lh={LH.snug} n={2} w={["95%", "45%"]} className="mt-[14px]" />
          <div className="mt-[16px] space-y-[8px]">
            <ButtonSk />
            <ButtonSk />
          </div>
        </SpPanelSk>
        <SpPanelSk title={90}>
          <div className="space-y-[14px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-[12px]">
                <RoundSk size={33} />
                <div className="min-w-0 flex-1">
                  <Lines fs={FS.t13} lh={LH.snug} w={[64, 110, 60][i]} />
                  <Lines fs={FS.t11} lh={LH.snug} w={[190, 140, 110][i]} className="mt-[2px]" />
                  <Lines fs={FS.t10} w={60} className="mt-[4px]" />
                </div>
              </div>
            ))}
          </div>
        </SpPanelSk>
        <Lines fs={FS.t11} lh={LH.snug} n={3} w={["95%", "92%", "40%"]} className="px-[4px]" />
      </Col>
    );
  }
  if (tab === "security") {
    return (
      <Col>
        <PageHeadSk back title={100} />
        <Panel className="px-[14px] pt-[16px] pb-[16px]">
          <SecurityHeadSk lines={2} />
          <ButtonSk className="mt-[16px]" />
        </Panel>
        <Panel className="px-[14px] pt-[16px] pb-[16px]">
          <SecurityHeadSk lines={1} />
          <div className="mt-[16px] rounded-[18px] bg-(--sp-soft) p-[14px]">
            <div className="flex items-start gap-[12px]">
              <TileSk size={44} />
              <div className="min-w-0 flex-1 pt-[3px]">
                <Lines fs={FS.t14} trim={0.25} w={110} />
                <Lines fs={FS.t11} trim={0.25} mt="5px" w={120} />
              </div>
              <GhostIconSk className="-mt-[6px] -mr-[6px]" />
            </div>
            <div className="mt-[14px] grid grid-cols-2 gap-[8px]">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-[12px] bg-(--sp-panel) px-[10px] py-[9px]">
                  <Lines fs={FS.t9} trim={0.25} w={40} />
                  <Lines fs={FS.t12} trim={0.25} mt="4px" w="75%" />
                </div>
              ))}
            </div>
          </div>
          <ButtonSk className="mt-[14px]" />
          <Lines fs={FS.t10} lh={LH.snug} center w={230} className="mt-[10px]" />
        </Panel>
      </Col>
    );
  }
  if (tab === "preferences") {
    return (
      <Col>
        <PageHeadSk back title={120} sub={180} />
        <SpPanelSk title={50} description={1}>
          <div className="grid grid-cols-3 gap-[10px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-[8px]">
                <S className="aspect-[0.62] w-full rounded-[16px]" />
                <Lines fs={FS.t12} trim={0.25} center w={36} className="w-full" />
              </div>
            ))}
          </div>
        </SpPanelSk>
        <SpPanelSk title={64}>
          <div className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[14px]">
            <Lines fs={FS.t10} trim={0.25} w={44} />
            <Lines fs="16px" lh={LH.snug} w={170} className="mt-[8px]" />
          </div>
          <div className="mt-[10px] flex h-[44px] items-center gap-[10px]">
            <S className="h-[10px] w-[16px]" />
            <S className="mx-[22px] h-[6px] flex-1" />
            <S className="h-[14px] w-[16px]" />
          </div>
          <Lines fs={FS.t11} trim={0.25} mt="2px" center w={44} />
        </SpPanelSk>
        <SpPanelSk title={36}>
          <div className="grid grid-cols-2 gap-[10px]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex min-h-[112px] flex-col items-start rounded-[18px] bg-(--sp-soft) px-[14px] pt-[12px] pb-[12px]">
                <Lines fs="2rem" trim={0.25} w={44} bar={0.6} />
                <Lines fs={FS.t12} trim={0.125} mt="10px" w="85%" />
                <div className="mt-auto pt-[10px]">
                  <Lines fs={FS.t11} trim={0.25} w={60} />
                </div>
              </div>
            ))}
          </div>
        </SpPanelSk>
        <SpPanelSk title={100}>
          <S className="h-[100px] w-full rounded-[16px]" />
          <div className="mt-[16px] space-y-[16px]">
            <FieldSk label={84}>
              <TabsSk n={3} surface="panel" widths={[36]} />
            </FieldSk>
            <FieldSk label={70}>
              <div className="flex min-h-[56px] items-center gap-[10.8px] rounded-2xl bg-(--sp-soft) py-[8px] pr-[8px] pl-[12px]">
                <TileSk />
                <span className="min-w-0 flex-1">
                  <Lines fs={FS.t13} trim={0.125} w={110} />
                  <Lines fs={FS.t11} trim={0.125} mt="3px" w={130} />
                </span>
                <S className="size-[14px] shrink-0" />
              </div>
            </FieldSk>
          </div>
        </SpPanelSk>
        <SpPanelSk title={110} description={1}>
          <div className="space-y-[16px]">
            <FieldSk label={110} hint={2}>
              <TabsSk n={2} surface="panel" widths={[90]} />
            </FieldSk>
            <FieldSk label={100} hint={1}>
              <div className="flex items-center gap-[10px]">
                <Lines fs={FS.t14} w={56} className="shrink-0" />
                <InputSk w={0} className="min-w-0 flex-1" />
                <Lines fs={FS.t14} w={34} className="shrink-0" />
              </div>
            </FieldSk>
          </div>
        </SpPanelSk>
      </Col>
    );
  }
  // account
  return (
    <Col>
      <PageHeadSk back title={130} />
      <ProfileHeroSk />
      <StatTilesSk />
      <SpPanelSk title={90} description={1}>
        <div className="space-y-[14px]">
          <div className="grid grid-cols-2 gap-[10px]">
            <FieldSk label={110} />
            <FieldSk label={110} />
          </div>
          <FieldSk label={40} hint={1}>
            <InputSk icon w={170} />
          </FieldSk>
          <ButtonSk />
        </div>
      </SpPanelSk>
      <RowGroupSk title={60}>
        {[40, 48, 56, 70].map((w, i) => (
          <SpRowSk
            key={i}
            className="pr-[14px]"
            lead={<TileSk />}
            title={w}
            trailing={i < 2 ? <S className="h-[22px] w-[56px] shrink-0" /> : <Lines fs={FS.t12} w={i === 2 ? 90 : 120} className="shrink-0" />}
          />
        ))}
      </RowGroupSk>
      <SignInActivitySkeleton />
    </Col>
  );
}

/** Admin > Users: search + Invite, then the users (avatar, name, email, role badge). */
function AdminUsersSk() {
  return (
    <Col>
      <div aria-hidden className="flex gap-[8px]">
        <InputSk icon w={100} className="min-w-0 flex-1" />
        <S className="h-[52px] w-[104px] shrink-0" />
      </div>
      <RowGroupSk>
        {Array.from({ length: 6 }, (_, i) => (
          <SpRowSk
            key={i}
            title={[120, 100, 130, 90, 110, 100][i]}
            sub="text"
            subW={[160, 150, 170, 140, 160, 150][i]}
            trailing={<S className="h-[22px] w-[56px] shrink-0" />}
          />
        ))}
      </RowGroupSk>
    </Col>
  );
}

/**
 * Admin > Trash (expenses, repeat expenses, balances): the trash tabs, then
 * "Trash" + count, rows (icon, name, date · avatar name, amount, Restore), the note.
 */
function TrashSk({ kind }: { kind: "expenses" | "repeats" | "balances" }) {
  return (
    <>
      <TabsSk n={3} size="sm" links active={kind === "expenses" ? 0 : kind === "repeats" ? 1 : 2} widths={[56, 96, 56]} />
      <Col>
        <RowGroupSk title={40} aside={80}>
          {Array.from({ length: 5 }, (_, i) => (
            <SpRowSk
              key={i}
              lead={<RoundSk size={kind === "balances" ? 40 : 33} />}
              title={[120, 90, 140, 100, 110][i]}
              sub="node"
              subLead={
                <>
                  <S className="h-[8px] shrink-0" style={{ width: kind === "expenses" ? 64 : 150 }} />
                  <S className="size-[16px] shrink-0" />
                </>
              }
              subW={56}
              trailing={
                <span className="flex shrink-0 items-center gap-[2px]">
                  <Lines fs={FS.t13} w={60} />
                  <GhostIconSk />
                </span>
              }
            />
          ))}
        </RowGroupSk>
        <Lines
          fs={FS.t11}
          lh={LH.snug}
          n={kind === "expenses" ? 1 : 2}
          w={kind === "expenses" ? ["70%"] : ["95%", "55%"]}
          className="px-[14px]"
        />
      </Col>
    </>
  );
}

/** One user (admin): own header with back, avatar + badges, details, sign-ins, Manage. */
function AdminUserSk() {
  return (
    <Col>
      <PageHeadSk back title={140} sub={170} />
      <div aria-hidden className="flex items-center gap-[12px] px-[2px]">
        <RoundSk size={64} />
        <div className="flex flex-1 items-center gap-[6px]">
          <S className="h-[22px] w-[56px]" />
          <S className="h-[22px] w-[56px]" />
        </div>
      </div>
      <InfoListSk rows={4} />
      <SignInHeatmapSkeleton />
      <RowGroupSk title={56}>
        <SpRowSk title={170} />
        <SpRowSk title={150} />
        <SpRowSk title={120} sub="text" subW={200} />
      </RowGroupSk>
    </Col>
  );
}

/** Company repeat expenses: header, Add button, RepeatRows. */
function RecurringSk() {
  return (
    <Col>
      <PageHeadSk title={170} sub={250} />
      <Col>
        <ButtonSk />
        <Col gap={12}>
          {[0, 1, 2].map((i) => (
            <RepeatRowSk key={i} />
          ))}
        </Col>
      </Col>
    </Col>
  );
}

/** One reminder: header with back, hero, details, Add / Skip and the note. */
function DueReminderSk() {
  return (
    <Col>
      <PageHeadSk back title={100} sub={100} />
      <Panel className="flex flex-col items-center gap-[10px] px-[16px] py-[22px]">
        <RoundSk size={48} />
        <Lines fs={FS.t14} center w={140} className="w-full" />
        <Lines fs={FS.t28} lh={LH.snug} center w={130} bar={0.6} className="w-full" />
        <S className="h-[22px] w-[72px]" />
      </Panel>
      <InfoListSk rows={3} />
      <div className="flex flex-col gap-[8px]">
        <ButtonSk />
        <ButtonSk />
        <Lines fs={FS.t11} lh={LH.snug} center w={230} className="px-[4px]" />
      </div>
    </Col>
  );
}

/** Company balances: header (+), the summary card, the rows, the note. */
function BalancesListSk() {
  return (
    <Col>
      <PageHeadSk back title={110} sub={170} actions={[44]} />
      <BalanceCardSk action={false} />
      <Panel className="px-[4px] py-[6px]">
        {[0, 1, 2, 3].map((i) => (
          <BalanceRowSk key={i} />
        ))}
      </Panel>
      <Lines fs={FS.t11} lh={LH.snug} w={250} className="px-[4px]" />
    </Col>
  );
}

/** One balance: header (+ Edit), purple hero with Recharge, tiles, Fix, details, history. */
function BalanceDetailSk() {
  return (
    <Col>
      <PageHeadSk back title={120} sub={160} actions={[44]} />
      <Panel className="px-[17px] pt-[16px] pb-[17px]">
        <div className="flex items-center justify-between gap-3">
          <RoundSk />
          <Lines fs={FS.t12} lh={LH.snug} w={90} />
        </div>
        <Lines fs={FS.t12} lh={LH.snug} w={130} className="mt-[16px]" />
        <Lines fs="34px" lh={1.3} w={150} bar={0.6} className="mt-[2px]" />
        <Lines fs={FS.t11} lh={LH.snug} w="80%" />
        <S className="mt-[12px] h-[6px] w-full" />
        <div className="mt-[14px] flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Lines fs={FS.t11} lh={LH.snug} w={56} />
            <Lines fs={FS.t15} lh={LH.snug} w={130} />
          </div>
          <S className="h-[48px] w-[124px] shrink-0" />
        </div>
      </Panel>
      <StatTilesSk />
      <ButtonSk />
      <InfoListSk rows={4} title={50} />
      <SpPanelSk title={56}>
        <TimelineSk n={3} kit changes={1} />
      </SpPanelSk>
    </Col>
  );
}

/** Add / edit a balance: the account, the money, alerts, note, the preview card, the bar. */
function BalanceFormSk({ edit }: { edit?: boolean }) {
  return (
    <Col>
      <PageHeadSk back title={edit ? 110 : 120} sub={60} />
      <SpPanelSk title={90}>
        <div className="space-y-[16px]">
          <FieldSk label={44} />
          <FieldSk label={120} hint={1}>
            <InputSk icon />
          </FieldSk>
          <FieldSk label={64} hint={1} />
        </div>
      </SpPanelSk>
      <SpPanelSk title={76}>
        <div className="space-y-[16px]">
          {edit ? <S className="w-full rounded-[16px]" style={{ height: `calc(${FS.t12} * 1.375 * 2 + 24px)` }} /> : <FieldSk label={90} hint={1} />}
          <FieldSk label={64} hint={1} />
          <div className="space-y-[8px]">
            <Lines fs={FS.t13} lh={LH.snug} w={80} className="px-[4px]" />
            {/* The chips wrap: 3 on the first line, "Custom…" on the second (each line full). */}
            <div className="flex flex-wrap gap-[8px]">
              {[0, 1, 2, 3].map((i) => (
                <S key={i} className={cn("h-[36px]", i === 3 ? "w-full" : "min-w-0 flex-1")} />
              ))}
            </div>
          </div>
          <FieldSk label={70} hint={1} />
        </div>
      </SpPanelSk>
      <SpPanelSk title={48}>
        <div className="space-y-[16px]">
          <FieldSk label={110} hint={1} />
          <FieldSk label={190}>
            <div className="flex items-center gap-[10px]">
              <InputSk w={0} className="w-[84px] shrink-0" />
              <Lines fs={FS.t13} w={76} />
            </div>
          </FieldSk>
          <S className="w-full rounded-[16px]" style={{ height: `calc(${FS.t12} * 1.375 * 3 + 24px)` }} />
        </div>
      </SpPanelSk>
      <SpPanelSk title={36} description={1}>
        {/* inline-block like the real textarea (it gets the same line space under it). */}
        <div className="inline-block min-h-[96px] w-full rounded-[16px] bg-(--sp-input) align-baseline" />
      </SpPanelSk>
      <Panel className="px-[17px] py-[16px]">
        <Lines fs={FS.t12} lh={LH.snug} w={120} />
        <Lines fs={FS.t20} lh={LH.snug} w={150} className="mt-[6px]" />
        <Lines fs={FS.t12} lh={LH.snug} w="75%" className="mt-[2px]" />
      </Panel>
      {edit ? <S className="h-[52px] w-full" /> : null}
      <FormBarSk cancel />
    </Col>
  );
}

/** Used when no page matches (a new page without its own skeleton yet). */
function GenericSk() {
  return (
    <Col>
      <PageHeadSk title={180} sub={150} />
      <SectionCardSk>
        {Array.from({ length: 4 }, (_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </SectionCardSk>
      <SectionCardSk>
        {Array.from({ length: 3 }, (_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </SectionCardSk>
    </Col>
  );
}

/* ---------------------------------------------------------------- routing */

const ADMIN_TABS = ["/admin/users", "/admin/categories", "/admin/trash"];

/** The skeleton for a path, or null if this path has none. */
function skeletonFor(pathname: string, scope: SkeletonScope, owner: boolean): ReactNode {
  const p = pathname.replace(/\/+$/, "") || "/";
  let m: RegExpMatchArray | null;

  if (p === "/") return <HomeSk />;
  if (p === "/alerts") return <AlertsSk />;

  if (p === "/transactions") return <TxListPageSk />;
  if (p === "/wallet/transactions") return <TxListPageSk wallet />;
  if ((m = p.match(/^\/(wallet\/)?transactions\/(new|[^/]+\/edit)$/))) {
    return <TxFormSk wallet={Boolean(m[1])} edit={m[2] !== "new"} />;
  }
  if (/^\/transactions\/[^/]+$/.test(p)) return <TxDetailSk />;
  if (/^\/wallet\/transactions\/[^/]+$/.test(p)) return <WalletTxDetailSk />;

  if (p === "/wallet") return <WalletHomeSk />;
  if (p === "/wallet/budgets") return <BudgetsSk />;
  if (p === "/wallet/goals") return <GoalsSk />;
  if (p === "/wallet/recurring") return <WalletRecurringSk />;
  if (p === "/wallet/categories") {
    return (
      <div className="flex flex-col gap-4">
        <WalletPageHeadSk title={110} lines={1} />
        <CatalogSk />
      </div>
    );
  }

  if (p === "/recurring") return <RecurringSk />;
  if (/^\/recurring\/due\/[^/]+$/.test(p)) return <DueReminderSk />;

  if (p === "/balances") return <BalancesListSk />;
  if ((m = p.match(/^\/balances\/(new|[^/]+\/edit)$/))) return <BalanceFormSk edit={m[1] !== "new"} />;
  if (/^\/balances\/[^/]+$/.test(p)) return <BalanceDetailSk />;

  // Settings: the layout has no title or tabs; each page draws its own header.
  if (p === "/settings") return <SettingsHubSk />;
  if ((m = p.match(/^\/settings\/(account|security|preferences|notifications)$/))) return <SettingsTabSk tab={m[1]} />;

  // Admin area: the owner only.
  if (!owner) return null;
  if (/^\/admin\/users\/[^/]+$/.test(p)) return <AdminUserSk />;
  let tab: ReactNode = null;
  if (p === "/admin/users") tab = <AdminUsersSk />;
  else if (p === "/admin/categories") tab = <CatalogSk />;
  else if (p === "/admin/trash") tab = <TrashSk kind="expenses" />;
  else if (p === "/admin/trash/recurring") tab = <TrashSk kind="repeats" />;
  else if (p === "/admin/trash/balances") tab = <TrashSk kind="balances" />;
  if (!tab) return null;
  // Inside the admin layout its title and tabs stay (a 16 gap column).
  if (scope === "admin") return tab;
  return (
    <Col>
      <PageHeader title="Admin" />
      <TabsSk n={3} links active={ADMIN_TABS.findIndex((t) => p === t || p.startsWith(`${t}/`))} widths={[40, 72, 40]} />
      {tab}
    </Col>
  );
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
