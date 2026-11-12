import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Settings hub and subpages (each draws its own header).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton scope="settings" />;
}
