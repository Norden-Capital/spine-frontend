// Search + filters for the company list and the wallet list (module 5).
// The filters live in the page address (?q=…&type=…), so a reload or a
// shared link keeps them. Query names = the backend's (docs/api-module5.md A).
import type { Currency, TxType } from "./transactions-types";

export type Filters = {
  q?: string;
  from?: string;
  to?: string;
  month?: string;
  categoryIds?: string[];
  tagIds?: string[];
  type?: TxType;
  currency?: Currency;
  createdBy?: string;
  minAmount?: string;
  maxAmount?: string;
};

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONEY = /^\d{1,10}(\.\d{1,2})?$/;

/** Read filters from page search params (bad values are dropped). */
export function parseFilters(p: Params): Filters {
  const f: Filters = {};
  const q = one(p.q);
  if (q) f.q = q.slice(0, 100);
  const from = one(p.from);
  const to = one(p.to);
  if (from && DAY.test(from)) f.from = from;
  if (to && DAY.test(to)) f.to = to;
  const month = one(p.month);
  if (month && MONTH.test(month) && !f.from && !f.to) f.month = month;
  const cats = list(p.categoryIds);
  if (cats.length) f.categoryIds = cats;
  const tags = list(p.tagIds);
  if (tags.length) f.tagIds = tags;
  const type = one(p.type);
  if (type === "EXPENSE" || type === "INCOME") f.type = type;
  const currency = one(p.currency);
  if (currency === "USD" || currency === "MAD") f.currency = currency;
  const by = one(p.createdBy);
  if (by) f.createdBy = by;
  const min = one(p.minAmount)?.replace(",", ".");
  const max = one(p.maxAmount)?.replace(",", ".");
  if (min && MONEY.test(min)) f.minAmount = min;
  if (max && MONEY.test(max)) f.maxAmount = max;
  return f;
}

/** Filters -> query string (without "?"). Lists as comma lists. */
export function filtersToQuery(f: Filters, extra: Record<string, string | number> = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || (Array.isArray(v) && v.length === 0)) continue;
    q.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  for (const [k, v] of Object.entries(extra)) q.set(k, String(v));
  return q.toString();
}

/** Are any filters on, other than the month? */
export function hasFilters(f: Filters): boolean {
  return Object.entries(f).some(([k, v]) => k !== "month" && v !== undefined && (!Array.isArray(v) || v.length > 0));
}
