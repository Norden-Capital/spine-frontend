import type { Metadata } from "next";
import { PageHeader } from "@/components/spine-ui";
import { ChangePasswordCard } from "@/components/settings/change-password-form";
import { PasskeysSection } from "@/components/settings/passkeys-section";
import { getPasskeys } from "@/components/settings/settings-data";

export const metadata: Metadata = { title: "Security" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function SecurityPage() {
  // getPasskeys() catches errors and calls unstable_rethrow (Next.js signals pass through).
  const passkeys = await getPasskeys();
  return (
    <>
      <PageHeader back={{ href: "/settings", label: "Back to settings" }} title="Security" />
      <ChangePasswordCard />
      <PasskeysSection passkeys={passkeys} />
    </>
  );
}
