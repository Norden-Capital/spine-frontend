import { getWalletStatus } from "@/lib/wallet-server";
import { PinSetup, PinUnlock, WalletSession } from "@/components/wallet/pin-gate";

// The private wallet: only its owner, never a manager. The PIN check blocks
// on the server, so no wallet data renders before the wallet is unlocked.
export const instant = false;

export default async function WalletLayout({ children }: LayoutProps<"/wallet">) {
  const status = await getWalletStatus();
  if (!status) {
    return (
      <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
        The wallet could not be opened. Please try again later.
      </p>
    );
  }
  if (!status.hasPin) return <PinSetup />;
  if (!status.unlocked) return <PinUnlock lockedUntil={status.lockedUntil} />;
  return <WalletSession>{children}</WalletSession>;
}
