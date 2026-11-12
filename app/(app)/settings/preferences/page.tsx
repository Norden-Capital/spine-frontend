import type { Metadata } from "next";
import { PageHeader } from "@/components/spine-ui";
import { PreferencesForm } from "@/components/settings/preferences-form";

export const metadata: Metadata = { title: "Preferences" };

// The prefs come from the (app) layout (PrefsProvider), read on the server.
export default function PreferencesPage() {
  return (
    <>
      <PageHeader
        back={{ href: "/settings", label: "Back to settings" }}
        title="Preferences"
        subtitle="Changes show right away and are saved."
      />
      <PreferencesForm />
    </>
  );
}
