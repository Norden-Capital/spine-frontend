import Link from "next/link";

export default function WalletTxNotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This wallet transaction does not exist.</p>
      <Link href="/wallet/transactions" className="mt-4 inline-flex h-11 items-center text-sm underline underline-offset-4">
        Back to the wallet
      </Link>
    </div>
  );
}
