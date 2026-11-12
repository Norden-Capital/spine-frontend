import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Admin > Trash.
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton scope="admin" />;
}
