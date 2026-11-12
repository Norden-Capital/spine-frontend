import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Home and every first-level page (expenses, wallet, alerts, settings, admin).
// Inside the app layout, so it shows only after its session check; the top
// bar and dock stay.
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
