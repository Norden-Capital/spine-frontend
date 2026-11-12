import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Wallet transactions list, and one wallet transaction / new / edit opened from it.
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
