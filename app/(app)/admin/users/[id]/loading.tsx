import { RouteSkeleton } from "@/components/nav/route-skeleton";

// One user (admin).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton scope="admin" />;
}
