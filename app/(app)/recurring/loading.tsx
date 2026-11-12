import { RouteSkeleton } from "@/components/nav/route-skeleton";

// Company repeat expenses (and one reminder under due/[id]).
// The skeleton follows the page being opened (see components/nav/route-skeleton.tsx).
export default function Loading() {
  return <RouteSkeleton />;
}
