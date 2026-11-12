/**
 * For the full-page states (not found, error, link does not work): drop the
 * kit EmptyState's round tinted circle and show only the icon, bigger, in its
 * color. Put on <EmptyState className>. (The kit part is Design's; this only
 * restyles its first child here.)
 */
export const PLAIN_STATE_ICON =
  "[&>span:first-child]:size-auto [&>span:first-child]:bg-transparent [&>span:first-child_svg]:size-[52px] [&>span:first-child_svg]:stroke-[1.5]";
