import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Admin > Users, and one user opened from the list.
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton scope="admin" />;
}
