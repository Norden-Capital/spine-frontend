import type { Metadata } from "next";
import {
  EmptyState,
  IconCalendar,
  IconClock,
  IconEdit,
  IconError,
  IconNoResults,
  IconReceipt,
  InfoList,
  PageHeader,
  SpPanel,
  StatTiles,
  Timeline,
  type TimelineEntry,
} from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { formatDay, todayIn, type DateSettings } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getActiveCategories } from "@/lib/catalog-server";
import { getBalance } from "@/lib/balances-server";
import {
  aboutDay,
  balancePath,
  barValue,
  frequencyLabel,
  frequencyShort,
  heroStatus,
  inWords,
  type Balance,
  type BalanceHistoryItem,
} from "@/lib/balances-types";
import { shortDay } from "@/lib/repeat-schedule";
import { formatMoney } from "@/lib/transactions-types";
import { BalanceBar, BalanceLogo, categoryPath } from "@/components/balances/balance-parts";
import { FixButton, RechargeButton } from "@/components/balances/balance-actions";
import { SpIconLink, SpLinkButton } from "@/components/transactions/sp-link";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

export const metadata: Metadata = { title: "Balance" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** One balance: hero (guess, bar, empty date, Recharge), tiles, Fix, details, history. Members read only. */
export default async function BalancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, dates, res, categories] = await Promise.all([
    requireUser(balancePath(id)),
    getDateSettings(),
    getBalance(id),
    getActiveCategories(),
  ]);
  const today = todayIn(dates.zone);
  const back = { href: "/balances", label: "Back to Balances" };

  if (!res.ok) {
    const missing = res.status === 404;
    return (
      <div className="flex flex-col gap-[16px]">
        <PageHeader title="Balance" back={back} />
        <EmptyState
          className={PLAIN_STATE_ICON}
          tone={missing ? "accent" : "danger"}
          icon={missing ? <IconNoResults /> : <IconError />}
          title={missing ? "Balance not found" : "Could not load"}
          text={missing ? "This balance no longer exists. It may be deleted." : "Please try again later."}
          action={
            <SpLinkButton href="/balances" size="lg">
              Balances
            </SpLinkButton>
          }
        />
      </div>
    );
  }

  const b = res.data.balance;
  // The backend says who may change it (the owner); the role check is the fallback.
  const owner = b.canEdit ?? isOwner(user);
  const fmt = { today, dateFormat: dates.dateFormat };
  const guess = formatMoney(b.guess);
  const category = categoryPath(b.category, categories);
  const days = b.daysLeft;
  const runsOut =
    !b.emptyDate || days === null
      ? "Lasts a long time"
      : days < 0
        ? `Since ${aboutDay(b.emptyDate, fmt)}`
        : days === 0
          ? "Today"
          : `${aboutDay(b.emptyDate, fmt)} · in ${inWords(days)}`;

  return (
    <div className="flex flex-col gap-[16px]" data-testid="balance-page" data-urgency={b.urgency}>
      <PageHeader
        back={back}
        title={b.name}
        subtitle={[b.website, category].filter(Boolean).join(" · ")}
        action={
          owner ? <SpIconLink href={`${balancePath(b.id)}/edit`} label="Edit balance" icon={<IconEdit aria-hidden />} /> : undefined
        }
      />

      {/* Purple hero: white text only (no pills, no other colours). */}
      <section
        className="rounded-(--sp-radius) bg-(--sp-card-front) px-[17px] pt-[16px] pb-[17px] text-(--sp-card-front-text)"
        data-testid="balance-hero"
      >
        <div className="flex items-center justify-between gap-3">
          <BalanceLogo b={b} size={44} onCard />
          <span className="text-[0.75rem] leading-snug font-medium">{owner ? heroStatus(b, today) : "View only"}</span>
        </div>
        <p className="mt-[16px] text-[0.75rem] leading-snug">Guessed balance today</p>
        <p className="mt-[2px] text-[34px] leading-[1.3] font-semibold tracking-tight tabular-nums" data-testid="balance-guess">
          {guess}
        </p>
        <p className="text-[0.6875rem] leading-snug">
          of {formatMoney(b.startAmount)} after the last recharge or fix · {shortDay(b.startDate, { ...fmt, weekday: true })}
        </p>
        <div className="mt-[12px]">
          <BalanceBar value={barValue(b)} tone="bg-white" onCard label={`${guess} of ${formatMoney(b.startAmount)} left`} />
        </div>
        <div className="mt-[14px] flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.6875rem] leading-snug">Runs out</p>
            <p className="text-[0.9375rem] leading-snug font-medium">{runsOut}</p>
          </div>
          {owner ? <RechargeButton b={b} today={today} categoryText={category} /> : null}
        </div>
      </section>

      <StatTiles
        items={[
          { icon: <IconCalendar />, tone: "violet", value: formatMoney(b.perMonth), label: "A month" },
          { icon: <IconReceipt />, tone: "sun", value: formatMoney(b.cut), label: `Each cut · ${frequencyShort(b.unit, b.every)}` },
          {
            icon: <IconClock />,
            tone: "ink",
            value: shortDay(b.nextCut, { dateFormat: dates.dateFormat }),
            label: `Next cut · ${shortDay(b.nextCut, { ...fmt, weekday: true }).split(" ")[0]}`,
          },
        ]}
      />

      {owner ? <FixButton b={b} today={today} /> : null}

      <InfoList
        title="Details"
        rows={[
          { label: "How often", value: frequencyLabel(b.unit, b.every) },
          {
            label: "Low limit",
            value: b.lowLimit
              ? `${formatMoney(b.lowLimit)}${b.lowFrom ? ` · ${b.lowFrom <= today ? "since" : "from"} ${aboutDay(b.lowFrom, fmt)}` : ""}`
              : "None",
          },
          {
            label: "Alerts",
            value: [b.lowLimit ? "Below limit" : null, `${b.warnDays} ${b.warnDays === 1 ? "day" : "days"} before`, "at $0"]
              .filter(Boolean)
              .join(" · "),
          },
          { label: "Category", value: category },
          ...(b.note ? [{ label: "Note", value: b.note }] : []),
        ]}
      />

      <SpPanel title="History" aside={<span className="text-[0.625rem] text-(--sp-text-faint)">Newest first</span>}>
        <Timeline entries={historyEntries(b, res.data.history, category, dates)} />
      </SpPanel>

      {!owner && (
        <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
          Only the owner can recharge, edit or delete a balance.
        </p>
      )}
    </div>
  );
}

/** The backend's history (newest first) as timeline entries. */
function historyEntries(b: Balance, items: BalanceHistoryItem[], category: string, dates: DateSettings): TimelineEntry[] {
  const day = (d: string | null) => (d ? formatDay(d, dates) : "");
  return items.map((h, i): TimelineEntry => {
    const id = `${h.type}-${h.date}-${i}`;
    const who = h.by?.name ? ` by ${h.by.name}` : "";
    const current = i === 0;
    switch (h.type) {
      case "CUTS": {
        const n = h.count ?? 0;
        const range = h.from && h.to && h.from !== h.to ? `${day(h.from)} – ${day(h.to)}` : day(h.to ?? h.date);
        return {
          id,
          current,
          title: `${n} ${n === 1 ? "cut" : "cuts"} (guessed)`,
          meta: `${range} · −${formatMoney(h.each ?? b.cut)} each`,
          changes: h.total ? [`−${formatMoney(h.total)} in total`] : undefined,
        };
      }
      case "RECHARGE":
        return {
          id,
          current,
          title: `Recharge +${formatMoney(h.amount ?? 0)}${who}`,
          meta: day(h.date),
          changes: [
            `Expense added: ${formatMoney(h.amount ?? 0)} · ${category}`,
            ...(h.startAfter ? [`New balance: ${formatMoney(h.startAfter)}`] : []),
          ],
        };
      case "FIX": {
        const diff = h.guessBefore != null ? Number(h.amount ?? 0) - Number(h.guessBefore) : 0;
        return {
          id,
          current,
          title: `Real balance fixed to ${formatMoney(h.amount ?? 0)}${who}`,
          meta: day(h.date),
          changes:
            h.guessBefore != null
              ? [`Spine guessed ${formatMoney(h.guessBefore)}${diff ? ` (off by ${formatMoney(Math.abs(diff))})` : ""}`]
              : undefined,
        };
      }
      default:
        return {
          id,
          current,
          title: `Added${who}`,
          meta: day(h.date),
          changes: h.amount != null ? [`Balance: ${formatMoney(h.amount)}`] : undefined,
        };
    }
  });
}
