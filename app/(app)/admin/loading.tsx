import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Admin tab content. Inside the admin layout (managers only): its title and tabs stay.
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton scope="admin" />;
}
