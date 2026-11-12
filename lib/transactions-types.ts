// Transactions (module 4): types and money formatting. Server and client.

export type Currency = "USD" | "MAD";
export type TxType = "EXPENSE" | "INCOME";

export type FileRef = { id: string; name: string; contentType: string; size: number };
export type PersonRef = { id: string; name: string };

export type Transaction = {
  id: string;
  type: TxType;
  /** Decimal as text, e.g. "123.45" (no rounding errors). */
  amount: string;
  currency: Currency;
  /** Calendar day "YYYY-MM-DD". */
  date: string;
  description: string;
  /** The transaction's own website as a bare domain ("claude.ai"), or null. */
  website?: string | null;
  /** The picture to show (own site, else category, else parent category): "/api/logos/…", or null = category icon. */
  logoUrl?: string | null;
  category: { id: string; name: string; icon: string; archived: boolean };
  tags: { id: string; name: string }[];
  files: FileRef[];
  createdBy: PersonRef;
  createdAt: string;
  updatedBy: PersonRef | null;
  updatedAt: string | null;
  canDelete: boolean;
};

export type Totals = Partial<Record<Currency, { in: string; out: string; net: string }>>;

export type MonthData = { items: Transaction[]; totals: Totals };

export type HistoryEntry = {
  at: string;
  by: PersonRef | string;
  action: string;
  changes: { field: string; from: unknown; to: unknown }[];
};

export const CURRENCIES: Currency[] = ["USD", "MAD"];

// ---- money -----------------------------------------------------------------

const NUMBER = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "$1,234.50" / "1,234.50 MAD". `sign`: "+" / "−" in front (for in/out). */
export function formatMoney(amount: string | number, currency: Currency, sign?: "+" | "-"): string {
  const value = Math.abs(Number(amount));
  const text = NUMBER.format(Number.isFinite(value) ? value : 0);
  const prefix = sign === "+" ? "+" : sign === "-" ? "−" : "";
  return currency === "USD" ? `${prefix}$${text}` : `${prefix}${text} MAD`;
}

/** Net total with its own sign: "+$400.00", "−$12.00", "$0.00". */
export function formatNet(amount: string, currency: Currency): string {
  const n = Number(amount);
  return formatMoney(n, currency, n > 0 ? "+" : n < 0 ? "-" : undefined);
}

/** Money typed by a person: "1 234,5" -> "1234.50"; null if not a valid positive amount. */
export function parseAmountInput(raw: string): string | null {
  const cleaned = raw.trim().replace(/[\s ']/g, "").replace(",", ".");
  if (!/^\d{1,10}(\.\d{0,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!(n > 0)) return null;
  return n.toFixed(2);
}

// ---- months ----------------------------------------------------------------

/** "2026-11" for a "YYYY-MM-DD" day. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/** "2026-11" + n months. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** "Nov 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Human file size: "2.4 MB". */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
