import { formatDateTime, formatDay, type DateSettings } from "@/lib/prefs";
import { formatMoney, type HistoryEntry, type PersonRef } from "@/lib/transactions-types";
import { UserAvatar } from "@/components/nav/user-avatar";
import { seedOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/components/spine-ui";

/**
 * The "History" timeline of the expense detail page, shared with the repeat
 * expense sheet. Same JSON from the backend for both:
 * [{at, by, action, changes: [{field, from, to}]}].
 */

/** Expense actions (the default). */
export const TX_ACTIONS: Record<string, string> = {
  CREATED: "Created",
  UPDATED: "Edited",
  DELETED: "Moved to trash",
  RESTORED: "Restored",
};

/** Expense fields (the default). */
export const TX_FIELDS: Record<string, string> = {
  type: "Type",
  amount: "Amount",
  currency: "Currency",
  date: "Date",
  description: "Description",
  website: "Website",
  category: "Category",
  categoryId: "Category",
  files: "Proof",
  fileIds: "Proof",
};

const HIDDEN_FIELDS = new Set(["tags", "tagIds"]);

/** A history value as short text: names for lists/objects, dates in the user's format. */
function show(field: string, value: unknown, dates: DateSettings, dateFields: ReadonlySet<string>): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    if (field === "files" || field === "fileIds") return `${value.length} file${value.length === 1 ? "" : "s"}`;
    return value.map((v) => show(field, v, dates, dateFields)).join(", ") || "—";
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return String(o.name ?? o.id ?? "—");
  }
  const text = String(value);
  if (dateFields.has(field) && /^\d{4}-\d{2}-\d{2}$/.test(text)) return formatDay(text, dates);
  if (field === "type") return text === "INCOME" ? "Income" : text === "EXPENSE" ? "Expense" : text;
  if (field === "amount" && /^\d+(\.\d+)?$/.test(text)) return formatMoney(text);
  return text;
}

const TX_DATE_FIELDS: ReadonlySet<string> = new Set(["date"]);

export function HistoryList({
  entries,
  dates,
  actions = TX_ACTIONS,
  fields = TX_FIELDS,
  dateFields = TX_DATE_FIELDS,
}: {
  entries: HistoryEntry[];
  dates: DateSettings;
  /** Action → title ("Created", "Edited"…). */
  actions?: Record<string, string>;
  /** Field → label ("Amount"…). */
  fields?: Record<string, string>;
  /** Fields whose "YYYY-MM-DD" values are shown in the user's date format. */
  dateFields?: ReadonlySet<string>;
}) {
  if (entries.length === 0) return <p className="text-[0.75rem] text-(--sp-text-muted)">No changes yet.</p>;
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <HistoryTimeline
      entries={sorted.map((e, i) => {
        const by = typeof e.by === "string" ? e.by : e.by?.name;
        return {
          person: e.by && typeof e.by !== "string" ? e.by : null,
          id: String(i),
          title: `${actions[e.action] ?? e.action}${by ? ` by ${by}` : ""}`,
          meta: formatDateTime(e.at, dates),
          // Tags were removed from the app: hide old tag changes.
          changes: (e.changes ?? []).filter((c) => !HIDDEN_FIELDS.has(c.field)).map(
            (c) => {
              const label = fields[c.field] ?? c.field;
              const from = show(c.field, c.from, dates, dateFields);
              // A new value (nothing before): "Amount: $64.10", not "Amount: — → $64.10".
              return from === "—"
                ? `${label}: ${show(c.field, c.to, dates, dateFields)}`
                : `${label}: ${from} → ${show(c.field, c.to, dates, dateFields)}`;
            }
          ),
          current: i === 0,
        };
      })}
    />
  );
}

/**
 * Same look as the kit Timeline (line with dots, title 12 / Medium, time
 * 10, changes 11), plus the face of who did it. The kit Timeline takes
 * only text, so it is drawn here.
 */
function HistoryTimeline({ entries }: { entries: (TimelineEntry & { person: PersonRef | null })[] }) {
  return (
    <ol className="relative">
      {entries.map((e, i) => (
        <li key={e.id} className="relative flex gap-[12px] pb-[16px] last:pb-0">
          <span aria-hidden className="relative flex w-[10px] shrink-0 justify-center">
            <span
              className={cn(
                "relative z-1 mt-[2px] size-[10px] rounded-full",
                e.current ? "bg-(--sp-card-front)" : "bg-(--sp-text-faint)"
              )}
            />
            {i < entries.length - 1 ? (
              <span className="absolute top-[14px] -bottom-[2px] w-[2px] rounded-full bg-(--sp-soft)" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1 leading-snug">
            <p className="truncate text-[0.75rem] font-medium text-(--sp-text)" title={e.title}>{e.title}</p>
            <p className="mt-[4px] text-[0.625rem] text-(--sp-text-faint)">{e.meta}</p>
            {e.changes?.length ? (
              <ul className="mt-[8px] space-y-[4px]">
                {e.changes.map((c) => (
                  <li key={c} className="text-[0.6875rem] leading-snug break-words text-(--sp-text-muted)">
                    {c}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {e.person ? <UserAvatar seed={seedOf(e.person)} size={24} /> : null}
        </li>
      ))}
    </ol>
  );
}
