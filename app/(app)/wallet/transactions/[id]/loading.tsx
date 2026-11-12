import { RouteSkeleton } from "@/components/nav/route-skeleton";

// One wallet transaction, and its edit form.
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
