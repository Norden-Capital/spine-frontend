import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Company balances (list, new, one balance, edit).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
