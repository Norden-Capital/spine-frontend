import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { formatDateTime, formatDay, type DateSettings } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getHistory, getTransaction } from "@/lib/transactions-server";
import { monthOf, type HistoryEntry, type Transaction } from "@/lib/transactions-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { Amount } from "@/components/transactions/amount";
import { DeleteTransaction } from "@/components/transactions/delete-transaction";
import { ProofGallery } from "@/components/transactions/proof-gallery";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function TransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params;
  const [res, history, dates] = await Promise.all([getTransaction(id), getHistory(id), getDateSettings()]);
  if (!res.ok && res.status === 401) redirect(`/login?next=${encodeURIComponent(`/transactions/${id}`)}`);
  if (!res.ok && (res.status === 404 || res.status === 400 || res.status === 403)) notFound();
  if (!res.ok) throw new Error(`Loading transaction failed (${res.status})`);
  const tx = res.data;
  const month = monthOf(tx.date);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/?month=${month}`}
        className="-ml-2 flex h-11 w-fit items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Transactions
      </Link>

      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
          <CategoryIcon name={tx.category.icon} className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-lg font-semibold break-words">{tx.description || tx.category.name}</h1>
          <p className="text-sm text-muted-foreground">
            {tx.type === "INCOME" ? "Income" : "Expense"} · {formatDay(tx.date, dates)}
          </p>
        </div>
      </div>
      <Amount type={tx.type} amount={tx.amount} currency={tx.currency} className="text-3xl" />

      <Card>
        <CardContent>
          <dl className="flex flex-col divide-y text-sm">
            <Row label="Category" value={tx.category.name + (tx.category.archived ? " (archived)" : "")} />
            <Row label="Tags" value={tx.tags.length ? tx.tags.map((t) => t.name).join(", ") : "—"} />
            <Row label="Created" value={`${tx.createdBy.name} · ${formatDateTime(tx.createdAt, dates)}`} />
            {tx.updatedAt && tx.updatedBy && (
              <Row label="Edited" value={`${tx.updatedBy.name} · ${formatDateTime(tx.updatedAt, dates)}`} />
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proof</CardTitle>
        </CardHeader>
        <CardContent>
          {tx.files.length ? (
            <ProofGallery files={tx.files} />
          ) : (
            <p className="text-sm text-muted-foreground">No proof.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/transactions/${encodeURIComponent(tx.id)}/edit`}
          className={buttonVariants({ size: "lg", className: "h-11" })}
        >
          <Pencil aria-hidden />
          Edit
        </Link>
        {tx.canDelete && <DeleteTransaction id={tx.id} month={month} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.ok ? (
            <History entries={history.data} tx={tx} dates={dates} />
          ) : (
            <p className="text-sm text-muted-foreground">History could not be loaded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{value}</dd>
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

function History({ entries, dates }: { entries: HistoryEntry[]; tx: Transaction; dates: DateSettings }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No changes yet.</p>;
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ol className="flex flex-col gap-4 border-l pl-4">
      {sorted.map((e, i) => {
        const by = typeof e.by === "string" ? e.by : e.by?.name;
        return (
          <li key={i} className="relative">
            <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-foreground" aria-hidden />
            <p className="text-sm">
              <span className="font-medium">{ACTIONS[e.action] ?? e.action}</span>
              {by && <span className="text-muted-foreground"> by {by}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{formatDateTime(e.at, dates)}</p>
            {e.changes?.length > 0 && (
              <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                {e.changes.map((c, j) => (
                  <li key={j} className="break-words">
                    <span className="text-muted-foreground">{FIELDS[c.field] ?? c.field}</span>{" "}
                    {show(c.field, c.from, dates)} → {show(c.field, c.to, dates)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
