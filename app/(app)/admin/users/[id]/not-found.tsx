import Link from "next/link";
import { IconUserRemove } from "@/components/spine-ui";
import { EmptyState } from "@/components/spine-ui";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

// Height of the space between the top bar and the dock (see app/(app)/layout.tsx),
// so the state sits in its middle.
const AREA = {
  minHeight:
    "calc(100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 12px - 44px - 17.5px - var(--sp-dock-h) - var(--sp-dock-gap) - 16px)",
};

/** Same look as SpButton primary, for a <Link>. */
const LINK_PRIMARY =
  "inline-flex h-[52px] items-center justify-center rounded-full bg-(--sp-chip-active) px-[24px] text-[14px] leading-none font-medium whitespace-nowrap text-(--sp-chip-active-text) transition outline-none select-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.98]";

export default function UserNotFound() {
  return (
    <div style={AREA} className="flex flex-col items-center justify-center">
      <EmptyState
        className={PLAIN_STATE_ICON}
        tone="accent"
        icon={<IconUserRemove />}
        title="User not found"
        text="This user does not exist, or you can't see them."
        action={
          <Link href="/admin/users" className={LINK_PRIMARY}>
            Back to users
          </Link>
        }
      />
    </div>
  );
}
