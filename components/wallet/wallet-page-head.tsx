import Link from "next/link";
import { IconBack } from "@/components/spine-ui";

/** "‹ Wallet" back link + title, for the wallet sub-pages. */
export function WalletPageHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Link href="/wallet" className="-ml-2 flex h-11 w-fit items-center gap-1 rounded-md px-2 text-sm text-(--sp-text-muted)">
        <IconBack className="size-4" aria-hidden />
        Wallet
      </Link>
      <h1 className="text-[22px] font-medium text-(--sp-text)">{title}</h1>
      {subtitle && <p className="text-sm text-(--sp-text-muted)">{subtitle}</p>}
    </div>
  );
}

export function WalletLoadError({ what }: { what: string }) {
  return (
    <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
      {what} could not be loaded. Please try again later.
    </p>
  );
}
