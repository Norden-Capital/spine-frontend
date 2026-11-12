import type { Metadata } from "next";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { Copy, Pencil } from "lucide-react";
import { backendGet } from "@/lib/auth";
import { Comments, type Comment } from "@/components/transactions/comments";
import { formatDateTime, formatDay, type DateSettings } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getHistory, getTransaction } from "@/lib/transactions-server";
import { formatMoney, monthOf, type HistoryEntry } from "@/lib/transactions-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { WebsiteLink } from "@/components/transactions/website-link";
import { DeleteTransaction } from "@/components/transactions/delete-transaction";
import { ProofGallery } from "@/components/transactions/proof-gallery";
import { SpLinkButton } from "@/components/transactions/sp-link";
import { InfoList, PageHeader, SpPanel, Timeline, TxHero } from "@/components/spine-ui";

export const metadata: Metadata = { title: "Transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function TransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params;
  const [res, history, dates, comments] = await Promise.all([
    getTransaction(id),
    getHistory(id),
    getDateSettings(),
    getComments(id),
  ]);
  if (!res.ok && res.status === 401) redirect(`/login?next=${encodeURIComponent(`/transactions/${id}`)}`);
  if (!res.ok && (res.status === 404 || res.status === 400 || res.status === 403)) notFound();
  if (!res.ok) throw new Error(`Loading transaction failed (${res.status})`);
  const tx = res.data;
  const month = monthOf(tx.date);

  const kind = tx.type === "INCOME" ? "Income" : "Expense";
  const back = `/transactions?month=${month}`;
  const fileCount = tx.files.length;

  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader back={{ href: back, label: "Back to transactions" }} title={kind} subtitle="Company" />

      <TxHero
        icon={<TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />}
        tag="Company"
        title={tx.description || tx.category.name}
        meta={`${tx.category.name} · ${formatDay(tx.date, dates)}`}
        amount={formatMoney(tx.amount, tx.currency, tx.type === "INCOME" ? "+" : "-")}
        kind={`${kind} · ${tx.currency}`}
      />

      <div className={tx.canDelete ? "grid grid-cols-3 gap-[8px]" : "grid grid-cols-2 gap-[8px]"}>
        <SpLinkButton href={`/transactions/${encodeURIComponent(tx.id)}/edit`} icon={<Pencil aria-hidden />}>
          Edit
        </SpLinkButton>
        <SpLinkButton
          href={`/transactions/new?copy=${encodeURIComponent(tx.id)}`}
          variant="secondary"
          icon={<Copy aria-hidden />}
        >
          Copy
        </SpLinkButton>
        {tx.canDelete && <DeleteTransaction id={tx.id} month={month} />}
      </div>

      <InfoList
        rows={[
          { label: "Category", value: tx.category.name + (tx.category.archived ? " (archived)" : "") },
          { label: "Tags", value: tx.tags.length ? tx.tags.map((t) => `#${t.name}`).join("  ") : "—" },
          ...(tx.website ? [{ label: "Website", value: <WebsiteLink domain={tx.website} /> }] : []),
          { label: "Created", value: `${tx.createdBy.name} · ${formatDateTime(tx.createdAt, dates)}` },
          ...(tx.updatedAt && tx.updatedBy
            ? [{ label: "Edited", value: `${tx.updatedBy.name} · ${formatDateTime(tx.updatedAt, dates)}` }]
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
    <Timeline
      entries={sorted.map((e, i) => {
        const by = typeof e.by === "string" ? e.by : e.by?.name;
        return {
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
