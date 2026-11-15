import type { ReactNode } from "react";
import { SpSkeleton } from "@/components/spine-ui";
import { WEEKS } from "@/lib/sign-ins";
import { cn } from "@/lib/utils";

// Building blocks for the loading skeletons (components/nav/route-skeleton.tsx
// and the sign-ins fallbacks). Each one copies the box of a real kit part:
// same padding, same line boxes, same gaps, so the page does not move when
// the real one comes. Text lines use the same rem sizes as the kit, so they
// follow the text-size preference too.
//
// Only gray blocks: never data. No hooks, so server components can use them.

export const S = SpSkeleton;

/** Kit font sizes (rem), as in the kit parts. */
export const FS = {
  t34: "34px",
  t30: "1.875rem",
  t28: "1.75rem",
  t22: "1.375rem",
  t20: "1.25rem",
  t16: "1rem",
  t15: "0.9375rem",
  t14: "0.875rem",
  t13: "0.8125rem",
  t12: "0.75rem",
  t11: "0.6875rem",
  t10: "0.625rem",
  t9: "0.5625rem",
} as const;

/** Leading: kit "leading-[1.5]" / "leading-normal" = 1.5, "leading-snug" = 1.375. */
export const LH = { normal: 1.5, snug: 1.375 } as const;

/**
 * Text line(s) as gray bars, in the real line box: `n` lines of `fs` × `lh`
 * tall. `trim` = the kit's "-my-[x em]" (0.25 or 0.125); `mt` = the kit's
 * "mt-[calc(Npx-x em)]" base (Npx), the trim is taken off like the kit does.
 */
export function Lines({
  fs,
  lh = LH.normal,
  n = 1,
  w = "60%",
  trim = 0,
  mt,
  center,
  bar = 0.7,
  className,
}: {
  fs: string;
  lh?: number;
  n?: number;
  /** Width of each line (cycles), e.g. "70%" or 120 (px). */
  w?: string | number | (string | number)[];
  trim?: number;
  mt?: string;
  center?: boolean;
  /** Bar height, as a part of the font size. */
  bar?: number;
  className?: string;
}) {
  const ws = Array.isArray(w) ? w : [w];
  const top = mt ? `calc(${mt} - ${fs} * ${trim})` : trim ? `calc(${fs} * -${trim})` : undefined;
  return (
    <span
      aria-hidden
      className={cn("block", className)}
      style={{ marginTop: top, marginBottom: trim ? `calc(${fs} * -${trim})` : undefined }}
    >
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={cn("flex items-center", center && "justify-center")} style={{ height: `calc(${fs} * ${lh})` }}>
          <S style={{ width: ws[i % ws.length], height: `calc(${fs} * ${bar})`, maxWidth: "100%" }} />
        </span>
      ))}
    </span>
  );
}

/** White panel (radius 22), like the kit panels. */
export function Panel({ className, children }: { className?: string; children?: ReactNode }) {
  return <div aria-hidden className={cn("rounded-(--sp-radius) bg-(--sp-panel)", className)}>{children}</div>;
}

/** A 44 round button (icon button, back, "+"): gray circle. */
export function RoundSk({ size = 44, className }: { size?: number; className?: string }) {
  return <S className={cn("shrink-0", className)} style={{ width: size, height: size }} />;
}

/** A ghost icon button (no circle until hover): 44 tap box, only its icon as a small gray dot. */
export function GhostIconSk({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex size-[44px] shrink-0 items-center justify-center", className)}>
      <S className="size-[18px]" />
    </span>
  );
}

/** Full-width pill button (SpButton lg = 52, md = 44). */
export function ButtonSk({ h = 52, className }: { h?: 44 | 52; className?: string }) {
  return <S className={cn("w-full", className)} style={{ height: h }} />;
}

/** Kit PageHeader: optional back (44), title 22 + optional subtitle 11, optional actions (44 each, or a pill width). */
export function PageHeadSk({
  back,
  title = 140,
  sub,
  actions = [],
}: {
  back?: boolean;
  title?: number | string;
  /** Subtitle width (none = no subtitle). */
  sub?: number | string;
  /** Right side: one width per button (44 = round button). */
  actions?: number[];
}) {
  return (
    <div aria-hidden className="flex min-h-[44px] items-center gap-[12px]">
      {back ? <RoundSk /> : null}
      <div className="min-w-0 flex-1">
        <Lines fs={FS.t22} trim={0.125} w={title} bar={0.6} />
        {sub ? <Lines fs={FS.t11} trim={0.125} mt="3px" w={sub} /> : null}
      </div>
      {actions.length ? (
        <div className="flex shrink-0 items-center gap-[8px]">
          {actions.map((w, i) => (
            <S key={i} className="shrink-0" style={{ width: w, height: 44 }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Kit Segmented: md = 44 (p 4), sm = 36 (p 3). The active item is a pill
 * (black in the real one, gray here); the others a short bar.
 */
export function TabsSk({
  n,
  active = 0,
  size = "md",
  surface = "page",
  widths = [52],
  links,
}: {
  n: number;
  /** Index of the active item, or -1 for none. */
  active?: number;
  size?: "md" | "sm";
  surface?: "page" | "panel";
  widths?: number[];
  /** Page tabs (links): 2 between the items, like the kit. */
  links?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 rounded-full",
        links && "gap-[2px]",
        size === "md" ? "h-[44px] p-[4px]" : "h-[36px] p-[3px]",
        surface === "page" ? "bg-(--sp-panel)" : "bg-(--sp-soft)"
      )}
    >
      {Array.from({ length: n }, (_, i) => (
        // Same padding on every item (as the kit), so they share the width the same way.
        <span key={i} className="relative flex min-w-0 flex-1 items-center justify-center px-[12px]">
          {i === active ? (
            <S className="absolute inset-0" />
          ) : (
            <S style={{ width: widths[i % widths.length], height: size === "md" ? 9 : 8, maxWidth: "100%" }} />
          )}
        </span>
      ))}
    </div>
  );
}

/** The kit input look (soft fill, radius 16, 52 tall), with a placeholder bar; `icon` = a left icon. */
export function InputSk({ icon, w = 110, h = 52, className }: { icon?: boolean; w?: number | string; h?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("flex items-center gap-[10px] rounded-[16px] bg-(--sp-input) px-[16px]", className)}
      style={{ height: h }}
    >
      {icon ? <S className="size-[18px] shrink-0" /> : null}
      <S className="h-[9px]" style={{ width: w }} />
    </div>
  );
}

/** SpField: label 13 (8 above the input), the input, an optional hint (11, `hint` lines). */
export function FieldSk({
  label = 80,
  hint = 0,
  children,
}: {
  label?: number;
  hint?: number;
  /** The input; default a plain 52 input. */
  children?: ReactNode;
}) {
  return (
    <div aria-hidden className="space-y-[8px]">
      {/* A flex row, like the kit's label row: the trimmed line box is its height. */}
      <div className="flex px-[4px]">
        <Lines fs={FS.t13} trim={0.125} w={label} />
      </div>
      {children ?? <InputSk />}
      {hint ? <Lines fs={FS.t11} lh={LH.snug} n={hint} w={["85%", "50%"]} className="px-[4px]" /> : null}
    </div>
  );
}

/** Kit SpPanel: title 13 (+ description 11), 14 under it, then the content. */
export function SpPanelSk({
  title = 90,
  description = 0,
  children,
  className,
}: {
  /** Title width, or 0 for none. */
  title?: number;
  /** Description lines. */
  description?: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("px-[14px] pt-[16px] pb-[16px]", className)}>
      {title ? (
        <div className="mb-[14px] flex flex-col">
          <Lines fs={FS.t13} trim={0.25} w={title} />
          {description ? <Lines fs={FS.t11} lh={LH.snug} n={description} w={["90%", "45%"]} className="mt-[6px]" /> : null}
        </div>
      ) : null}
      {children}
    </Panel>
  );
}

/** Kit RowGroup: panel p 4, optional title row (44, title 13 + small aside). */
export function RowGroupSk({ title, aside, children }: { title?: number; aside?: number; children: ReactNode }) {
  return (
    <Panel className="p-[4px]">
      {title ? (
        <div className="flex min-h-[44px] items-end justify-between gap-3 px-[10px] pb-[6px]">
          <Lines fs={FS.t13} trim={0.25} w={title} />
          {aside ? <Lines fs={FS.t10} lh={LH.snug} w={aside} /> : null}
        </div>
      ) : null}
      {children}
    </Panel>
  );
}

/**
 * Kit SpRow: 56 min, py 8, leading, title 13 (+ subtitle 11), trailing.
 * `sub`: "text" (plain subtitle) or "node" (a custom row, 3 under the title).
 */
export function SpRowSk({
  lead = <RoundSk size={33} />,
  title = "55%",
  sub,
  subW = "40%",
  subLead,
  trailing,
  className,
}: {
  lead?: ReactNode;
  title?: number | string;
  sub?: "text" | "node";
  subW?: number | string;
  /** Node subtitle: something before the text (e.g. a 16 avatar). */
  subLead?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("flex min-h-[56px] items-center gap-[10.8px] py-[8px] pr-[8px] pl-[14px]", className)}>
      {lead}
      <span className="min-w-0 flex-1">
        <Lines fs={FS.t13} trim={0.125} w={title} />
        {sub === "text" ? <Lines fs={FS.t11} trim={0.125} mt="3px" w={subW} /> : null}
        {sub === "node" ? (
          <span className="mt-[3px] flex items-center gap-[5px]" style={{ height: `calc(${FS.t11} * 1.5)` }}>
            {subLead}
            <S className="min-w-0" style={{ width: subW, height: `calc(${FS.t11} * 0.7)` }} />
          </span>
        ) : null}
      </span>
      {trailing}
    </div>
  );
}

/** Kit IconTile (colored rounded square): 33 / 44 / 52. */
export function TileSk({ size = 33 }: { size?: 33 | 44 | 52 }) {
  const radius = size === 33 ? 10 : size === 44 ? 13 : 16;
  return <S className="shrink-0" style={{ width: size, height: size, borderRadius: radius }} />;
}

/** Kit InfoList: label left, value right, 44 per row, optional title. */
export function InfoListSk({ rows, title }: { rows: number; title?: number }) {
  return (
    <Panel className="px-[14px] py-[6px]">
      {title ? (
        <div className="pt-[12px] pb-[4px]">
          <Lines fs={FS.t13} trim={0.25} w={title} />
        </div>
      ) : null}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex min-h-[44px] items-center justify-between gap-[16px] py-[8px]">
          <Lines fs={FS.t12} lh={LH.snug} w={[56, 64, 48, 72][i % 4]} className="shrink-0" />
          <Lines fs={FS.t13} lh={LH.snug} w={[110, 130, 90, 120][i % 4]} className="min-w-0" />
        </div>
      ))}
    </Panel>
  );
}

/** Kit StatTiles: n tiles (radius 18), icon tile 33, value 15, label 10 (`labelLines`). */
export function StatTilesSk({ n = 3, labelLines = 2 }: { n?: number; labelLines?: number }) {
  return (
    <div aria-hidden className="grid gap-[8px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex min-w-0 flex-col rounded-[18px] bg-(--sp-panel) px-[12px] pt-[12px] pb-[12px]">
          <TileSk />
          <Lines fs={FS.t15} trim={0.25} mt="12px" w="55%" />
          <Lines fs={FS.t10} trim={0.125} mt="5px" n={labelLines} w={["90%", "60%"]} />
        </div>
      ))}
    </div>
  );
}

/** Kit SectionCard: title row (49, title 13 + "View All") + content, pb 8. */
export function SectionCardSk({ title = 90, action = 44, children }: { title?: number; action?: number; children: ReactNode }) {
  return (
    <Panel className="pb-[8px]">
      <div className="flex h-[49px] items-start justify-between pt-[25px] pr-[12px] pl-[14px]">
        <Lines fs="13px" trim={0.25} w={title} />
        {action ? <Lines fs="10px" trim={0.25} mt="2px" w={action} /> : null}
      </div>
      <div>{children}</div>
    </Panel>
  );
}

/**
 * History with dots (10): HistoryList (company transaction: title 12 and
 * meta 10, leading-snug) or, with `kit`, the kit Timeline (trimmed lines,
 * `changes` = gray lines under each entry).
 */
export function TimelineSk({ n = 2, kit, changes = 0 }: { n?: number; kit?: boolean; changes?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex gap-[12px] pb-[16px] last:pb-0">
          <span className="flex w-[10px] shrink-0 justify-center">
            <S className="mt-[2px] size-[10px]" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            {kit ? (
              <>
                <Lines fs={FS.t12} trim={0.25} w={i ? "45%" : "60%"} />
                <Lines fs={FS.t10} trim={0.25} mt="4px" w="35%" />
                {changes ? <Lines fs={FS.t11} lh={LH.snug} n={changes} w="55%" className="mt-[8px]" /> : null}
              </>
            ) : (
              <>
                <Lines fs={FS.t12} lh={LH.snug} w={i ? "45%" : "60%"} />
                <Lines fs={FS.t10} lh={LH.snug} w="35%" className="mt-[4px]" />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- sign-ins charts */

/**
 * Kit SignInHeatmap (admin, one user): title + summary, 26 × 7 squares,
 * months, legend. `dayLine`: with the "tap a square" line under it
 * (SignInChart in a settings card).
 */
export function SignInHeatmapSkeleton({ dayLine }: { dayLine?: boolean }) {
  const chart = (
    <section
      aria-busy={dayLine ? undefined : true}
      aria-label={dayLine ? undefined : "Loading sign-ins"}
      className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[14px]", dayLine ? "pb-[12px]" : "pb-[14px]")}
    >
      <div className="flex items-center justify-between gap-3">
        <Lines fs={FS.t13} trim={0.25} w={60} />
        <Lines fs={FS.t10} trim={0.25} w={110} />
      </div>
      <div className="mt-[14px] flex gap-[6px]">
        {/* Same day names as the chart, so the grid gets the same width. */}
        <div aria-hidden className="grid shrink-0 grid-rows-7 gap-[3px] text-[0.5625rem] leading-[1.5] text-transparent [&>*]:-my-[0.25em]">
          {["Mon", "", "Wed", "", "Fri", "", ""].map((d, i) => (
            <span key={i} className="flex items-center">
              {d}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
            {Array.from({ length: WEEKS * 7 }, (_, i) => (
              <S key={i} className="aspect-square rounded-[3px]" />
            ))}
          </div>
          <div className="mt-[6px] h-[10px]" />
        </div>
      </div>
      <Lines fs={FS.t10} trim={0.25} mt="12px" w={190} />
    </section>
  );
  if (!dayLine) return chart;
  return (
    <div aria-busy aria-label="Loading sign-ins" className="rounded-(--sp-radius) bg-(--sp-panel)">
      {chart}
      <DayLineSk />
    </div>
  );
}

/** SignInChart's line under the chart ("Tap a square to see that day."). */
function DayLineSk() {
  return (
    <div className="mx-[14px] mb-[14px] min-h-[40px] rounded-[12px] bg-(--sp-soft) px-[12px] py-[10px]">
      <Lines fs={FS.t12} lh={LH.snug} w="55%" />
    </div>
  );
}

/** My account: kit SignInActivity (big number, round dots) + the "tap a square" line under it. */
export function SignInActivitySkeleton() {
  return (
    <div aria-busy aria-label="Loading sign-ins" className="rounded-(--sp-radius) bg-(--sp-panel)">
      <div className="px-[14px] pt-[16px] pb-[12px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Lines fs={FS.t13} trim={0.25} w={60} />
            <div className="mt-[12px] flex items-center gap-[8px]">
              <Lines fs={FS.t30} trim={0.25} w={36} />
              <Lines fs={FS.t11} trim={0.25} w={110} />
            </div>
          </div>
          <S className="h-[24px] w-[96px] shrink-0" />
        </div>
        <div className="mt-[14px] rounded-[16px] bg-(--sp-soft) px-[10px] pt-[12px] pb-[10px]">
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
            {Array.from({ length: WEEKS * 7 }, (_, i) => (
              <S key={i} className="aspect-square" />
            ))}
          </div>
          <div className="mt-[8px] h-[10px]" />
        </div>
        <Lines fs={FS.t10} trim={0.25} mt="12px" w={200} />
      </div>
      <DayLineSk />
    </div>
  );
}
