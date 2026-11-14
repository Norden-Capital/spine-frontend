import Link from "next/link";
import { EmptyWalletTime, type Icon as IconsaxIcon } from "iconsax-react";
import { IconWarning } from "@/components/spine-ui";
import { TxLogo } from "@/components/expenses/tx-logo";
import { cn } from "@/lib/utils";
import type { DateFormat } from "@/lib/prefs";
import {
  balancePath,
  barValue,
  runsOutLine,
  statusText,
  type Balance,
  type BalanceUrgency,
} from "@/lib/balances-types";
import { formatMoney } from "@/lib/transactions-types";

/** An iconsax Bulk icon in the current colour (for the few icons the kit has no name for). */
export function BulkIcon({ icon: Icon, className = "size-[20px]" }: { icon: IconsaxIcon; className?: string }) {
  return <Icon variant="Bulk" color="currentColor" className={className} aria-hidden />;
}

/** The Balances icon (quick action, empty state). */
export function BalancesIcon({ className }: { className?: string }) {
  return <BulkIcon icon={EmptyWalletTime} className={className} />;
}

/** The site's logo (TxLogo: apple-touch-icon → favicon → category icon). Never initials. */
export function BalanceLogo({ b, size = 40, onCard }: { b: Pick<Balance, "logoUrls" | "category">; size?: number; onCard?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full [&_svg]:size-[45%]",
        onCard ? "bg-white/15 text-white" : "bg-(--sp-soft) text-(--sp-text)"
      )}
      style={{ width: size, height: size }}
    >
      <TxLogo logoUrls={b.logoUrls} icon={b.category.icon} />
    </span>
  );
}

const BAR: Record<BalanceUrgency, string> = {
  RED: "bg-(--sp-danger)",
  AMBER: "bg-(--sp-warning)",
  GREEN: "bg-(--sp-success)",
};

export function BalanceBar({
  value,
  tone,
  onCard,
  label,
}: {
  value: number;
  /** A bg-* class; defaults by status. */
  tone: string;
  onCard?: boolean;
  label: string;
}) {
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("block h-[6px] overflow-hidden rounded-full", onCard ? "bg-white/25" : "bg-(--sp-soft)")}
    >
      <span
        className={cn("block h-full rounded-full", tone)}
        style={{ width: `${Math.max(value * 100, value > 0 ? 4 : 0)}%` }}
      />
    </span>
  );
}

/** Right-hand status, text only (no background): red + warning icon, amber + dot, nothing when OK. */
export function BalanceStatusText({ b, today }: { b: Balance; today: string }) {
  const s = statusText(b, today);
  if (!s) return null;
  const red = s.tone === "red";
  return (
    <span
      data-testid="balance-status"
      className={cn(
        "inline-flex shrink-0 items-center gap-[5px] text-[0.625rem] leading-[1.5] font-medium whitespace-nowrap [&_svg]:size-[12px]",
        red ? "text-(--sp-due-red-text)" : "text-(--sp-due-soon-text)"
      )}
    >
      {red ? <IconWarning aria-hidden /> : <span aria-hidden className="size-[6px] rounded-full bg-current" />}
      {s.label}
    </span>
  );
}

/** One balance: logo, name + guessed balance, bar, gray date line + status text on the right. */
export function BalanceRow({ b, today, dateFormat }: { b: Balance; today: string; dateFormat: DateFormat }) {
  const guess = formatMoney(b.guess);
  return (
    <Link
      href={balancePath(b.id)}
      data-testid="balance-row"
      className="flex gap-[12px] rounded-[16px] px-[10px] py-[10px] outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:bg-(--sp-soft)"
    >
      <BalanceLogo b={b} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-[10px]">
          <span className="min-w-0 truncate text-[0.8125rem] leading-[1.5] font-medium text-(--sp-text)">{b.name}</span>
          <span className="shrink-0 text-[0.8125rem] leading-[1.5] font-semibold text-(--sp-text) tabular-nums">{guess}</span>
        </span>
        <span className="mt-[6px] block">
          <BalanceBar
            value={barValue(b)}
            tone={BAR[b.urgency]}
            label={`${b.name}: ${guess} of ${formatMoney(b.startAmount)} left`}
          />
        </span>
        <span className="mt-[7px] flex items-start justify-between gap-[8px]">
          <span className="min-w-0 text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            {runsOutLine(b, { today, dateFormat })}
          </span>
          <BalanceStatusText b={b} today={today} />
        </span>
      </span>
    </Link>
  );
}

/** "Software › API" (the main's name from `all`, when known). */
export function categoryPath(c: Balance["category"], all?: { id: string; name: string }[] | null): string {
  const parent = c.parentId ? all?.find((x) => x.id === c.parentId) : undefined;
  return parent ? `${parent.name} › ${c.name}` : c.name;
}
