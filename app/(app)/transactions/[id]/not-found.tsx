import Link from "next/link";

export default function TransactionNotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-lg font-semibold">Transaction not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">It does not exist, or it is in the trash.</p>
      <Link href="/" className="mt-4 inline-flex h-11 items-center text-sm underline underline-offset-4">
        Back to transactions
      </Link>
    </div>
  );
}
