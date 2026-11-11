import type { Metadata } from "next";
import { PreferencesForm } from "@/components/settings/preferences-form";

export const metadata: Metadata = { title: "Preferences" };

// The prefs come from the (app) layout (PrefsProvider), read on the server.
export default function PreferencesPage() {
  return <PreferencesForm />;
}
