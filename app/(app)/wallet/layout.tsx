import { getWalletStatus } from "@/lib/wallet-server";
import { PinSetup, PinUnlock, WalletSession } from "@/components/wallet/pin-gate";
import { EmptyState, IconWarning } from "@/components/spine-ui";

// The private wallet: only the user, not even the company owner. The PIN check blocks
// on the server, so no wallet data renders before the wallet is unlocked.
export const instant = false;

export default async function WalletLayout({ children }: LayoutProps<"/wallet">) {
  const status = await getWalletStatus();
  if (!status) {
    return (
      <EmptyState
        framed
        tone="danger"
        icon={<IconWarning aria-hidden />}
        title="The wallet could not be opened"
        text="Please try again later."
      />
    );
  }
  if (!status.hasPin) return <PinSetup />;
  if (!status.unlocked) return <PinUnlock lockedUntil={status.lockedUntil} />;
  return <WalletSession>{children}</WalletSession>;
}
