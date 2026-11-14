// Server-only: alerts (module 5) for the bell and the alerts page.
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";

export type Alert = {
  id: string;
  kind: string;
  /** Whose alert: the company (owner + members) or my private wallet. */
  scope?: "COMPANY" | "PRIVATE";
  title: string;
  body: string;
  /** Frontend path hint, e.g. "/wallet/budgets". */
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type AlertList = { unreadCount: number; items: Alert[] };

/** GET /api/alerts (newest 50); null if the backend can't answer. */
export async function getAlerts(): Promise<AlertList | null> {
  try {
    const res = await backendGet("/alerts");
    return res.ok ? ((await res.json()) as AlertList) : null;
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

/** Unread count for the bell; 0 if unknown. */
export async function getUnreadAlerts(): Promise<number> {
  return (await getAlerts())?.unreadCount ?? 0;
}
