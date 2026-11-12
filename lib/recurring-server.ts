// Server-only: company repeat expenses (reminders) from the backend, with the session cookie.
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";
import type { CompanyRecurring, Occurrence } from "./recurring-types";

export type RecurringResult<T> = { ok: true; data: T } | { ok: false; status: number };

async function getJson<T>(path: string): Promise<RecurringResult<T>> {
  try {
    const res = await backendGet(path);
    if (!res.ok) {
      if (res.status >= 500) console.error(`[recurring] ${path} failed: ${res.status}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    console.error(`[recurring] ${path} failed:`, err);
    return { ok: false, status: 0 };
  }
}

/** All repeat expenses: next date first, finished last (everyone can read). */
export const getCompanyRecurring = () => getJson<CompanyRecurring[]>("/recurring");
/** Reminders waiting (date has come in my zone), oldest first. */
export const getRecurringDue = () => getJson<Occurrence[]>("/recurring/due");
/** One reminder, any status. 404 = occurrence_not_found. */
export const getOccurrence = (id: string) => getJson<Occurrence>(`/recurring/occurrences/${encodeURIComponent(id)}`);
