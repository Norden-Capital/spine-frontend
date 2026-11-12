import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { backendGet } from "@/lib/auth";
import { displayName, ROLE_LABEL, type AdminUser } from "@/lib/auth-types";
import { formatDate, formatDateTime, todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { InfoList, PageHeader } from "@/components/spine-ui";
import { RoleBadge, StatusBadge } from "@/components/admin/user-badges";
import { UserDetailActions } from "@/components/admin/user-detail-actions";
import { UserSignIns } from "./sign-ins";

export const metadata: Metadata = { title: "User" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

// One user: details, their sign-ins and actions (if I may manage them).
// The backend answers 404 for a user I am not allowed to see.
export default async function UserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const path = `/admin/users/${encodeURIComponent(id)}`;
  const [res, dates] = await Promise.all([backendGet(path), getDateSettings()]);
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (res.status === 403) redirect("/");
  if (res.status === 404 || res.status === 400) notFound();
  if (!res.ok) throw new Error(`Loading user failed (${res.status})`);
  const user = (await res.json()) as AdminUser;
  const name = displayName(user);

  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        back={{ href: "/admin/users", label: "Back to users" }}
        title={name}
        subtitle={name !== user.email ? user.email : undefined}
      />
      <div className="flex flex-wrap gap-[6px] px-[2px]">
        <RoleBadge role={user.role} />
        <StatusBadge status={user.status} />
      </div>

      <InfoList
        rows={[
          { label: "Email", value: <span className="break-all">{user.email}</span> },
          { label: "Role", value: ROLE_LABEL[user.role] ?? user.role },
          { label: "Created", value: formatDate(user.createdAt, dates) },
          { label: "Last login", value: user.lastLoginAt ? formatDateTime(user.lastLoginAt, dates) : "Never" },
        ]}
      />

      <UserSignIns path={`${path}/sign-ins`} today={todayIn(dates.zone)} />

      <UserDetailActions user={user} />
    </div>
  );
}
