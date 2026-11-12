import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Wallet pages. Inside the wallet layout: only shown once the PIN check passed (before it, the app skeleton shows, with no data).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
