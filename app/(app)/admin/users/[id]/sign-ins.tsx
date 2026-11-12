// Server component: the user's 6-month sign-ins chart (kit SignInHeatmap).
// The chart streams in; the page shows first with a skeleton in its place.
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { CloudOff } from "lucide-react";
import { backendGet } from "@/lib/auth";
import { addDays, WEEKS, type SignInDay } from "@/lib/sign-ins";
import { EmptyState, SignInHeatmap, SpSkeleton, type SignInDay as Cell } from "@/components/spine-ui";

/** `path`: backend path without ?from, e.g. "/admin/users/{id}/sign-ins". */
export function UserSignIns({ path, today }: { path: string; today: string }) {
  return (
    <Suspense fallback={<SignInsSkeleton />}>
      <SignIns path={path} today={today} />
    </Suspense>
  );
}

/** The Monday that starts the first of the 26 week columns ending this week. */
function mondayStart(today: string): string {
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
  return addDays(today, -weekday - (WEEKS - 1) * 7);
}

function monthLabel(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
}

function times(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

async function SignIns({ path, today }: { path: string; today: string }) {
  const start = mondayStart(today);
  let data: SignInDay[] | null = null;
  try {
    const res = await backendGet(`${path}?from=${start}`);
    if (res.ok) data = (await res.json()) as SignInDay[];
    else console.error(`[sign-ins] ${path} failed: ${res.status}`);
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    console.error(`[sign-ins] ${path} failed:`, err);
  }
  if (!data) {
    return (
      <EmptyState
        framed
        tone="danger"
        icon={<CloudOff />}
        title="Sign-ins could not be loaded"
        text="Please try again later."
      />
    );
  }

  const byDate = new Map(data.map((d) => [d.date, d]));
  const days: Cell[] = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const date = addDays(start, i);
    const day = date > today ? undefined : byDate.get(date);
    return (day?.ok ?? 0) > 0 ? "ok" : (day?.failed ?? 0) > 0 ? "failed" : "none";
  });
  const inRange = data.filter((d) => d.date >= start && d.date <= today);
  const okDays = inRange.filter((d) => d.ok > 0).length;
  const failed = inRange.reduce((sum, d) => sum + d.failed, 0);

  // Month name under the week column where a new month starts.
  const months: { label: string; week: number }[] = [];
  for (let week = 0; week < WEEKS; week++) {
    const first = addDays(start, week * 7);
    const last = addDays(first, 6);
    if (week === 0) months.push({ label: monthLabel(last), week });
    else if (last.slice(5, 7) !== addDays(last, -7).slice(5, 7)) months.push({ label: monthLabel(last), week });
  }
  // Two names too close at the start would overlap: keep the second.
  if (months.length > 1 && months[1].week < 3) months.shift();

  return (
    <SignInHeatmap
      days={days}
      months={months}
      summary={`${times(okDays, "day")} · ${times(failed, "failed try", "failed tries")}`}
    />
  );
}

function SignInsSkeleton() {
  return (
    <section
      aria-busy
      aria-label="Loading sign-ins"
      className="rounded-(--sp-radius) bg-(--sp-panel) p-[14px]"
    >
      <div className="flex items-baseline justify-between gap-3 leading-none">
        <h2 className="text-[0.8125rem] font-medium text-(--sp-text)">Sign-ins</h2>
        <SpSkeleton className="h-[8px] w-[96px]" />
      </div>
      <SpSkeleton className="mt-[14px] h-[150px] w-full rounded-[12px]" />
    </section>
  );
}
