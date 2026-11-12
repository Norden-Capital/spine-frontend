import { EmptyState, IconWarning, PageHeader } from "@/components/spine-ui";

/**
 * Title of the wallet sub-pages: the kit PageHeader with its round back
 * button (to the wallet), and the subtitle under it on full lines (the kit
 * subtitle is one cut line; these are sentences).
 */
export function WalletPageHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <PageHeader back={{ href: "/wallet", label: "Back to wallet" }} title={title} />
      {subtitle && <p className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text-muted)">{subtitle}</p>}
    </div>
  );
}

/** "… could not be loaded": the kit error state in a panel. */
export function WalletLoadError({ what }: { what: string }) {
  return (
    <EmptyState
      framed
      tone="danger"
      icon={<IconWarning aria-hidden />}
      title={`${what} could not be loaded`}
      text="Please try again later."
    />
  );
}
