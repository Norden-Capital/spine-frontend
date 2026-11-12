import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { PasskeysSection, type Passkey } from "@/components/settings/passkeys-section";

export const metadata: Metadata = { title: "Security" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

async function getPasskeys(): Promise<Passkey[] | null> {
  try {
    const res = await backendGet("/me/passkeys");
    return res.ok ? ((await res.json()) as Passkey[]) : null;
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    return null;
  }
}

export default async function SecurityPage() {
  const passkeys = await getPasskeys();
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>You stay logged in here. Your other devices are logged out.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
      <PasskeysSection passkeys={passkeys} />
    </>
  );
}
