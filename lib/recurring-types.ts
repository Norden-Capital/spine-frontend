// Company repeat expenses: types. Server and client.
// REMINDERS ONLY: the server never adds a transaction by itself.
import type { TxType } from "./transactions-types";
import type { RepeatUnit, UpcomingDate } from "./repeat-schedule";

export type OccurrenceStatus = "DUE" | "DONE" | "SKIPPED";

export type RecurringCategory = {
  id: string;
  name: string;
  icon: string;
  archived: boolean;
  parentId?: string | null;
  kind?: TxType;
};

/** GET /api/recurring: one repeat expense (template). */
export type CompanyRecurring = {
  id: string;
  type: TxType;
  /** Decimal as text, e.g. "1200.00". */
  amount: string;
  description: string;
  category: RecurringCategory;
  website: string | null;
  logoUrls: string[];
  /** How often: every `every` `unit`s (e.g. MONTH / 3). */
  unit: RepeatUnit;
  every: number;
  startDate: string;
  endDate: string | null;
  /** Next real date (skipped dates left out). null = the series is finished. */
  nextDate: string | null;
  /** Paused with no end. */
  paused: boolean;
  /** Paused until this day ("YYYY-MM-DD"), then it goes on by itself. */
  pausedUntil: string | null;
  /** The next 6 dates from my today, with their status. */
  upcoming: UpcomingDate[];
  /** Reminders waiting (DUE). */
  dueCount: number;
};

/** One reminder (GET /api/recurring/due, /api/recurring/occurrences/{id}). */
export type Occurrence = {
  id: string;
  recurringId: string;
  dueDate: string;
  status: OccurrenceStatus;
  /** DUE and the due date is before my today. */
  overdue: boolean;
  /** The saved transaction when DONE. */
  transactionId: string | null;
  type: TxType;
  amount: string;
  description: string;
  category: RecurringCategory;
  website: string | null;
  logoUrls: string[];
};

/** The page that opens one reminder (also the alert link). */
export const duePath = (occurrenceId: string) => `/recurring/due/${encodeURIComponent(occurrenceId)}`;
