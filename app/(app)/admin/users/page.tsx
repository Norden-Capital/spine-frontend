import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { backendGet } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth-types";
import { UsersAdmin } from "./users-admin";

export const metadata: Metadata = { title: "Users" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

// The list is loaded on the server, so the page shows with its data right
// away (no "Loading users…" flash). router.refresh() reloads it after a change.
export default async function UsersPage() {
  const res = await backendGet("/admin/users");
  if (res.status === 401) redirect("/login?next=%2Fadmin%2Fusers");
  if (res.status === 403) notFound(); // not the owner: the Admin area does not exist
  const users = res.ok ? ((await res.json()) as AdminUser[]) : null;

  return <UsersAdmin users={users} />;
}
