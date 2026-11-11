import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backendGet } from "@/lib/auth";
import { ROLE_LABEL, type MyAccount } from "@/lib/auth-types";
import { formatDate, formatDateTime, todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountDetailsForm } from "@/components/settings/account-details-form";
import { DetailRow, LoadError, SignInsCard } from "@/components/settings/sign-ins-card";

export const metadata: Metadata = { title: "Account" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

const STATUS: Record<string, string> = { ACTIVE: "Active", INVITED: "Invited", DISABLED: "Disabled" };

export default async function AccountPage() {
  const [res, dates] = await Promise.all([backendGet("/me"), getDateSettings()]);
  if (res.status === 401) redirect("/login?next=%2Fsettings%2Faccount");
  const me = res.ok ? ((await res.json()) as MyAccount) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent>
          {me ? (
            <AccountDetailsForm email={me.email} firstName={me.firstName} lastName={me.lastName} />
          ) : (
            <LoadError what="Your details" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {me ? (
            <dl className="flex flex-col divide-y text-sm">
              <DetailRow label="Role" value={ROLE_LABEL[me.role] ?? me.role} />
              <DetailRow label="Status" value={STATUS[me.status] ?? me.status} />
              <DetailRow label="Created" value={formatDate(me.createdAt, dates)} />
              <DetailRow label="Last login" value={me.lastLoginAt ? formatDateTime(me.lastLoginAt, dates) : "Never"} />
            </dl>
          ) : (
            <LoadError what="Your account" />
          )}
        </CardContent>
      </Card>

      <SignInsCard path="/me/sign-ins" today={todayIn(dates.zone)} />
    </>
  );
}
