import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Settings > Preferences content (title and tabs stay).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton scope="settings" />;
}
