// Settings: a hub (/settings) and three subpages with a back button.
export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return <div className="flex flex-col gap-[16px]">{children}</div>;
}
