// Server component: a card with the 6-month sign-ins chart. The chart
// streams in; the page shows first with a skeleton in its place.
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "@/lib/auth";
import { chartStart, WEEKS, type SignInDay } from "@/lib/sign-ins";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInChart } from "./sign-in-chart";

/** `path`: backend path without ?from, e.g. "/me/sign-ins" or "/admin/users/{id}/sign-ins". */
export function SignInsCard({ path, today }: { path: string; today: string }) {
  return (
    <Card>
      <CardContent>
        <Suspense fallback={<SignInsSkeleton />}>
          <SignIns path={path} today={today} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

export function LoadError({ what }: { what: string }) {
  return (
    <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
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

async function SignIns({ path, today }: { path: string; today: string }) {
  let days: SignInDay[] | null = null;
  try {
    const res = await backendGet(`${path}?from=${chartStart(today)}`);
    if (res.ok) days = (await res.json()) as SignInDay[];
    else console.error(`[sign-ins] ${path} failed: ${res.status}`);
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    console.error(`[sign-ins] ${path} failed:`, err);
  }
  if (!days) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">Sign-ins</h2>
        <LoadError what="Sign-ins" />
      </div>
    );
  }
  return <SignInChart days={days} today={today} />;
}

function SignInsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy aria-label="Loading sign-ins">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Sign-ins</h2>
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-1.5">
        <span className="w-[1.375rem]" />
        <div className="grid grid-flow-col grid-cols-[repeat(26,minmax(0,1fr))] grid-rows-7 gap-[3px]">
          {Array.from({ length: WEEKS * 7 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-[2px]" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
