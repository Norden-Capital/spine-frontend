import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { backendGet } from "@/lib/auth";
import { displayName, ROLE_LABEL, type AdminUser } from "@/lib/auth-types";
import { formatDate, formatDateTime, todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { Card, CardContent } from "@/components/ui/card";
import { RoleBadge, StatusBadge } from "@/components/admin/user-badges";
import { UserDetailActions } from "@/components/admin/user-detail-actions";
import { DetailRow, SignInsCard } from "@/components/settings/sign-ins-card";

export const metadata: Metadata = { title: "User" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

// One user: details, actions (if I may manage them) and their sign-ins.
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
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/users"
        className="-ml-2 flex h-11 w-fit items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Users
      </Link>

      <UserDetailActions user={user}>
        <h1 className="text-xl font-semibold break-all">{name}</h1>
        {name !== user.email && <p className="text-sm break-all text-muted-foreground">{user.email}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
        </div>
      </UserDetailActions>

      <Card>
        <CardContent>
          <dl className="flex flex-col divide-y text-sm">
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Role" value={ROLE_LABEL[user.role] ?? user.role} />
            <DetailRow label="Created" value={formatDate(user.createdAt, dates)} />
            <DetailRow
              label="Last login"
              value={user.lastLoginAt ? formatDateTime(user.lastLoginAt, dates) : "Never"}
            />
          </dl>
        </CardContent>
      </Card>

      <SignInsCard path={`${path}/sign-ins`} today={todayIn(dates.zone)} />
    </div>
  );
}
