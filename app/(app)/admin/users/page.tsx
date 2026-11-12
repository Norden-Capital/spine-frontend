import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backendGet, requireUser } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth-types";
import { UsersAdmin } from "./users-admin";

export const metadata: Metadata = { title: "Users" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

// The list is loaded on the server, so the page shows with its data right
// away (no "Loading users…" flash). router.refresh() reloads it after a change.
export default async function UsersPage() {
  const me = await requireUser("/admin/users");
  const res = await backendGet("/admin/users");
  if (res.status === 401) redirect("/login?next=%2Fadmin%2Fusers");
  if (res.status === 403) redirect("/");
  const users = res.ok ? ((await res.json()) as AdminUser[]) : null;

  return <UsersAdmin users={users} myRole={me.role} />;
}
