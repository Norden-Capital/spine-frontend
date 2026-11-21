import { RouteSkeleton } from "@/components/nav/route-skeleton";

// One wallet budget (this month + past months).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
