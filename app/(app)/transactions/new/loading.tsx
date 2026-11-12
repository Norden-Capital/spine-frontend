import { RouteSkeleton } from "@/components/nav/route-skeleton";

// New transaction form (no dock).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
