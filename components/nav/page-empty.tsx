import { EmptyState, type EmptyStateProps } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

/*
 * Empty list pages (no transactions, no results, no budgets, empty trash…)
 * fill the screen: the empty state sits in the middle of the free space
 * between what is above it on the page (title, month, search, tabs) and the
 * dock. No small box at the top with a big blank gap under it.
 *
 * How: <main> (app/(app)/layout.tsx) already spans from the top bar to the
 * dock (the app column is min-h-svh, safe areas included). When the page
 * holds a [data-page-empty] block, <main> and every box between it and the
 * block become flex columns that grow, so the block can take all the space
 * left and center its content. Pages need nothing else: just use
 * <PageEmpty>, wherever it is in the page.
 *
 * In @layer components, so a Tailwind utility on a box wins (e.g. "hidden"
 * on the old page while a skeleton shows, "contents" on its wrapper).
 */
const FILL_RULE = `@layer components {
  main:has([data-page-empty]), main :has([data-page-empty]) { display: flex; flex-direction: column; }
  main :has([data-page-empty]) { flex: 1 0 auto; }
}`;

/**
 * Full-height empty state for list pages: the kit EmptyState (plain, not in
 * a panel), centered in the free space down to the dock.
 */
export function PageEmpty({ className, ...props }: Omit<EmptyStateProps, "framed">) {
  return (
    <div data-page-empty="" className="flex flex-1 flex-col items-center justify-center">
      {/* React puts this once in <head>, however many pages use it. */}
      <style href="sp-page-empty" precedence="default">
        {FILL_RULE}
      </style>
      <EmptyState {...props} className={cn("w-full", className)} />
    </div>
  );
}
