import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/spine-ui";

// Height of the space between the top bar and the dock (see app/(app)/layout.tsx),
// so the state sits in its middle.
const AREA = {
  minHeight:
    "calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 12px - 44px - 17.5px - var(--sp-dock-h) - var(--sp-dock-gap) - 16px)",
};

/** Same look as SpButton primary, for a <Link>. */
const LINK_PRIMARY =
  "inline-flex h-[52px] items-center justify-center rounded-full bg-(--sp-chip-active) px-[24px] text-[14px] leading-none font-medium whitespace-nowrap text-(--sp-chip-active-text) transition outline-none select-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.98]";

export default function WalletTxNotFound() {
  return (
    <div style={AREA} className="flex flex-col items-center justify-center">
      <EmptyState
        tone="accent"
        icon={<SearchX />}
        title="Not found"
        text="This wallet transaction does not exist."
        action={
          <Link href="/wallet/transactions" className={LINK_PRIMARY}>
            Back to the wallet
          </Link>
        }
      />
    </div>
  );
}
