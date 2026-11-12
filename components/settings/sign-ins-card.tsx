// Server component: a panel with the 6-month sign-ins chart. The chart
// streams in; the page shows first with a skeleton in its place.
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "@/lib/auth";
import { addDays, chartStart, WEEKS, type SignInDay } from "@/lib/sign-ins";
import { SpPanel, SpSkeleton } from "@/components/spine-ui";
import { SignInChart } from "./sign-in-chart";

type Variant = "heatmap" | "activity";

/**
 * `path`: backend path without ?from, e.g. "/me/sign-ins" or "/admin/users/{id}/sign-ins".
 * `variant`: "heatmap" (square grid, admin) or "activity" (big number + round dots, My account).
 */
export function SignInsCard({ path, today, variant = "heatmap" }: { path: string; today: string; variant?: Variant }) {
  return (
    <Suspense fallback={<SignInsSkeleton />}>
      <SignIns path={path} today={today} variant={variant} />
    </Suspense>
  );
}

export function LoadError({ what }: { what: string }) {
  return (
    <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[20px] text-center text-[0.8125rem] leading-snug text-(--sp-text-muted)">
      {what} could not be loaded. Please try again later.
    </p>
  );
}

/** One "label: value" line of a details list (inside a <dl>). */
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-all">{value}</dd>
    </div>
  );
}

/**
 * The kit chart has Monday on top, so its first column starts on the Monday
 * 25 weeks before this week's Monday (lib chartStart is Sunday-based).
 */
function mondayStart(today: string): string {
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(today, -weekday - (WEEKS - 1) * 7);
}

async function SignIns({ path, today, variant }: { path: string; today: string; variant: Variant }) {
  const start = mondayStart(today);
  // Same call as before; only on a Sunday does `from` go 6 days earlier, so the first column has data.
  const from = [chartStart(today), start].sort()[0];
  let days: SignInDay[] | null = null;
  try {
    const res = await backendGet(`${path}?from=${from}`);
    if (res.ok) days = (await res.json()) as SignInDay[];
    else console.error(`[sign-ins] ${path} failed: ${res.status}`);
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    console.error(`[sign-ins] ${path} failed:`, err);
  }
  if (!days) {
    return (
      <SpPanel title="Sign-ins">
        <LoadError what="Sign-ins" />
      </SpPanel>
    );
  }
  return <SignInChart days={days} today={today} start={start} variant={variant} />;
}

function SignInsSkeleton() {
  return (
    <section
      aria-busy
      aria-label="Loading sign-ins"
      className="rounded-(--sp-radius) bg-(--sp-panel) p-[14px]"
    >
      <div className="flex items-center justify-between">
        <SpSkeleton className="h-[12px] w-[64px]" />
        <SpSkeleton className="h-[9px] w-[110px]" />
      </div>
      <div className="mt-[14px] flex gap-[6px]">
        <span className="w-[1.25rem] shrink-0" />
        <div
          className="grid min-w-0 flex-1 grid-flow-col grid-rows-7 gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: WEEKS * 7 }, (_, i) => (
            <SpSkeleton key={i} className="aspect-square rounded-[3px]" />
          ))}
        </div>
      </div>
      <SpSkeleton className="mt-[16px] h-[40px] w-full rounded-[12px]" />
    </section>
  );
}
