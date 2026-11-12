import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CopyPlus, Pencil, Repeat } from "lucide-react";
import { formatDateTime, formatDay } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { monthOf } from "@/lib/transactions-types";
import { getWalletTx } from "@/lib/wallet-server";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { Amount } from "@/components/transactions/amount";
import { ProofGallery } from "@/components/transactions/proof-gallery";
import { DeleteWalletTx } from "@/components/wallet/delete-wallet-tx";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Wallet transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function WalletTxPage({ params }: PageProps<"/wallet/transactions/[id]">) {
  const { id } = await params;
  const [res, dates] = await Promise.all([getWalletTx(id), getDateSettings()]);
  if (!res.ok && (res.status === 404 || res.status === 400)) notFound();
  if (!res.ok) throw new Error(`Loading wallet transaction failed (${res.status})`);
  const tx = res.data;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/wallet/transactions?month=${monthOf(tx.date)}`}
        className="-ml-2 flex h-11 w-fit items-center gap-1 rounded-md px-2 text-sm text-(--sp-text-muted)"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Wallet transactions
      </Link>
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--sp-panel)">
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
            <Row label="Added" value={formatDateTime(tx.createdAt, dates)} />
            {tx.updatedAt && <Row label="Edited" value={formatDateTime(tx.updatedAt, dates)} />}
          </dl>
          {tx.recurringId && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat className="size-4" aria-hidden />
              Made by a recurring item.
              <Link href="/wallet/recurring" className="underline underline-offset-2">
                See recurring
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      {tx.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Proof</CardTitle>
          </CardHeader>
          <CardContent>
            <ProofGallery files={tx.files} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/wallet/transactions/${encodeURIComponent(tx.id)}/edit`}
          className={buttonVariants({ size: "lg", className: "h-11" })}
        >
          <Pencil aria-hidden />
          Edit
        </Link>
        <Link
          href={`/wallet/transactions/new?copy=${encodeURIComponent(tx.id)}`}
          className={buttonVariants({ variant: "outline", size: "lg", className: "h-11" })}
        >
          <CopyPlus aria-hidden />
          Copy
        </Link>
        <DeleteWalletTx id={tx.id} month={monthOf(tx.date)} />
      </div>
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
