import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsTabs />
      {children}
    </div>
  );
}
