"use client";

import Link from "next/link";
import { IconOffline, IconRestore } from "@/components/spine-ui";
import { EmptyState, SpButton } from "@/components/spine-ui";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

// Height of the space between the top bar and the dock (see app/(app)/layout.tsx:
// 12 top padding, 44 top bar, 17.5 gap, dock space), so the state sits in its middle.
const AREA = {
  minHeight:
    "calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 12px - 44px - 17.5px - var(--sp-dock-h) - var(--sp-dock-gap) - 16px)",
};

/** Same look as SpButton secondary, for a <Link>. */
const LINK_SECONDARY =
  "inline-flex h-[52px] items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sp-text)_7%,transparent)] px-[24px] text-[14px] leading-none font-medium whitespace-nowrap text-(--sp-text) transition outline-none select-none hover:bg-[color-mix(in_oklab,var(--sp-text)_11%,transparent)] focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.98]";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={AREA} className="flex flex-col items-center justify-center">
      <EmptyState
        className={PLAIN_STATE_ICON}
        tone="danger"
        icon={<IconOffline />}
        title="Something went wrong"
        text="We could not load this page. Check your connection and try again."
        action={
          <>
            <SpButton icon={<IconRestore />} onClick={() => reset()}>
              Try again
            </SpButton>
            {/* No browser back button in the home-screen app: always a way out. */}
            <Link href="/" className={LINK_SECONDARY}>
              Go home
            </Link>
          </>
        }
      />
    </div>
  );
}
