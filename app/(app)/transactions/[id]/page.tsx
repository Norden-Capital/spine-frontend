import type { Metadata } from "next";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { IconCopy, IconEdit } from "@/components/spine-ui";
import { backendGet } from "@/lib/auth";
import { Comments, type Comment } from "@/components/transactions/comments";
import { formatDateTime, formatDay, type DateSettings } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getHistory, getTransaction } from "@/lib/transactions-server";
import { formatMoney, monthOf, type HistoryEntry, type PersonRef } from "@/lib/transactions-types";
import { UserAvatar } from "@/components/nav/user-avatar";
import { seedOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { TxLogo } from "@/components/expenses/tx-logo";
import { WebsiteLink } from "@/components/transactions/website-link";
import { DeleteTransaction } from "@/components/transactions/delete-transaction";
import { ProofGallery } from "@/components/transactions/proof-gallery";
import { SpLinkButton } from "@/components/transactions/sp-link";
import { ShareTransaction } from "@/components/transactions/share-transaction";
import { getActiveCategories } from "@/lib/catalog-server";
import { InfoList, PageHeader, SpPanel, TxHero, type TimelineEntry } from "@/components/spine-ui";

export const metadata: Metadata = { title: "Transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function TransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params;
  const [res, history, dates, comments, categories] = await Promise.all([
    getTransaction(id),
    getHistory(id),
    getDateSettings(),
    getComments(id),
    getActiveCategories(),
  ]);
  if (!res.ok && res.status === 401) redirect(`/login?next=${encodeURIComponent(`/transactions/${id}`)}`);
  if (!res.ok && (res.status === 404 || res.status === 400 || res.status === 403)) notFound();
  if (!res.ok) throw new Error(`Loading transaction failed (${res.status})`);
  const tx = res.data;
  const month = monthOf(tx.date);

  const kind = tx.type === "INCOME" ? "Income" : "Expense";
  const back = `/transactions?month=${month}`;
  const fileCount = tx.files.length;

  // Share text: "Hotel Rabat · −$120.00 · Travel › Hotels · 12 Nov 2026".
  // The transaction only has its own category; the main one comes from the picker list.
  const cat = categories?.find((c) => c.id === tx.category.id);
  const main = cat?.parentId ? categories?.find((c) => c.id === cat.parentId) : undefined;
  const shareText = [
    tx.description || tx.category.name,
    formatMoney(tx.amount, tx.type === "INCOME" ? "+" : "-"),
    main ? `${main.name} › ${tx.category.name}` : tx.category.name,
    new Date(`${tx.date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
  ].join(" · ");

  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader back={{ href: back, label: "Back to transactions" }} title={kind} subtitle="Company" />

      <TxHero
        icon={<TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />}
        tag="Company"
        title={tx.description || tx.category.name}
        meta={`${tx.category.name} · ${formatDay(tx.date, dates)}`}
        amount={formatMoney(tx.amount, tx.type === "INCOME" ? "+" : "-")}
        kind={kind}
      />

      {/* Edit / Delete: only if the backend says so (canEdit / canDelete: I added it, or I am the owner).
          Copy and Share: everyone. */}
      <div className="grid grid-cols-2 gap-[8px]">
        {tx.canEdit && (
          <SpLinkButton href={`/transactions/${encodeURIComponent(tx.id)}/edit`} icon={<IconEdit aria-hidden />}>
            Edit
          </SpLinkButton>
        )}
        <SpLinkButton
          href={`/transactions/new?copy=${encodeURIComponent(tx.id)}`}
          variant="secondary"
          icon={<IconCopy aria-hidden />}
        >
          Copy
        </SpLinkButton>
        <ShareTransaction title={tx.description || tx.category.name} text={shareText} path={`/transactions/${encodeURIComponent(tx.id)}`} />
        {tx.canDelete && <DeleteTransaction id={tx.id} month={month} />}
      </div>

      <InfoList
        rows={[
          { label: "Category", value: tx.category.name + (tx.category.archived ? " (archived)" : "") },
          ...(tx.website ? [{ label: "Website", value: <WebsiteLink domain={tx.website} /> }] : []),
          { label: "Created", value: <ByLine person={tx.createdBy} text={`${tx.createdBy.name} · ${formatDateTime(tx.createdAt, dates)}`} /> },
          ...(tx.updatedAt && tx.updatedBy
            ? [
                {
                  label: "Edited",
                  value: <ByLine person={tx.updatedBy} text={`${tx.updatedBy.name} · ${formatDateTime(tx.updatedAt, dates)}`} />,
                },
              ]
            : []),
        ]}
      />

      <SpPanel
        title="Proof"
        aside={
          fileCount ? (
            <span className="text-[0.625rem] text-(--sp-text-faint)">
              {fileCount} file{fileCount === 1 ? "" : "s"}
            </span>
          ) : undefined
        }
      >
        {fileCount ? (
          <ProofGallery files={tx.files} />
        ) : (
          <p className="text-[0.75rem] text-(--sp-text-muted)">No proof.</p>
        )}
      </SpPanel>

      <SpPanel title="Comments">
        <Comments txId={tx.id} initial={comments} />
      </SpPanel>

      <SpPanel title="History">
        {history.ok ? (
          <History entries={history.data} dates={dates} />
        ) : (
          <p className="text-[0.75rem] text-(--sp-text-muted)">History could not be loaded.</p>
        )}
      </SpPanel>
    </div>
  );
}

const ACTIONS: Record<string, string> = {
  CREATED: "Created",
  UPDATED: "Edited",
  DELETED: "Moved to trash",
  RESTORED: "Restored",
};

const FIELDS: Record<string, string> = {
  type: "Type",
  amount: "Amount",
  currency: "Currency",
  date: "Date",
  description: "Description",
  website: "Website",
  category: "Category",
  categoryId: "Category",
  tags: "Tags",
  tagIds: "Tags",
  files: "Proof",
  fileIds: "Proof",
};

/** A history value as short text: names for lists/objects, dates in the user's format. */
function show(field: string, value: unknown, dates: DateSettings): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    if (field === "files" || field === "fileIds") return `${value.length} file${value.length === 1 ? "" : "s"}`;
    return value.map((v) => show(field, v, dates)).join(", ") || "—";
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return String(o.name ?? o.id ?? "—");
  }
  const text = String(value);
  if (field === "date" && /^\d{4}-\d{2}-\d{2}$/.test(text)) return formatDay(text, dates);
  if (field === "type") return text === "INCOME" ? "Income" : text === "EXPENSE" ? "Expense" : text;
  return text;
}

function History({ entries, dates }: { entries: HistoryEntry[]; dates: DateSettings }) {
  if (entries.length === 0) return <p className="text-[0.75rem] text-(--sp-text-muted)">No changes yet.</p>;
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <HistoryTimeline
      entries={sorted.map((e, i) => {
        const by = typeof e.by === "string" ? e.by : e.by?.name;
        return {
          person: e.by && typeof e.by !== "string" ? e.by : null,
          id: String(i),
          title: `${ACTIONS[e.action] ?? e.action}${by ? ` by ${by}` : ""}`,
          meta: formatDateTime(e.at, dates),
          changes: (e.changes ?? []).map(
            (c) => `${FIELDS[c.field] ?? c.field}: ${show(c.field, c.from, dates)} → ${show(c.field, c.to, dates)}`
          ),
          current: i === 0,
        };
      })}
    />
  );
}

/** "Anna Smith · 12 Nov 2026, 14:20" with the person's face in front. */
function ByLine({ person, text }: { person: PersonRef; text: string }) {
  return (
    <span className="inline-flex items-center justify-end gap-[8px]">
      <UserAvatar seed={seedOf(person)} size={22} className="self-start" />
      <span>{text}</span>
    </span>
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
            <p className="text-[0.75rem] font-medium text-(--sp-text)">{e.title}</p>
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

/** GET comments (oldest first); null if they could not be loaded. */
async function getComments(id: string): Promise<Comment[] | null> {
  try {
    const res = await backendGet(`/transactions/${encodeURIComponent(id)}/comments`);
    return res.ok ? ((await res.json()) as Comment[]) : null;
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}
