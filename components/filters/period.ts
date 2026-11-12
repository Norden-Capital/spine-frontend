const LONG = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-11" -> "November 2026". */
export function longMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return LONG.format(new Date(Date.UTC(y, m - 1, 1)));
}
