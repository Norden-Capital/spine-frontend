import Link from "next/link";
import { IconQuestion } from "@/components/spine-ui";
import { EmptyState } from "@/components/spine-ui";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

/** Same look as SpButton primary, for a <Link>. */
const LINK_PRIMARY =
  "inline-flex h-[52px] items-center justify-center rounded-full bg-(--sp-chip-active) px-[24px] text-[14px] leading-snug font-medium whitespace-nowrap text-(--sp-chip-active-text) transition outline-none select-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.98]";

// Unknown page. The home-screen app has no browser back button, so always
// offer a way home. No top bar or dock here: centered in the screen.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col items-center justify-center px-(--sp-gutter) text-(--sp-text)">
      <EmptyState
        className={PLAIN_STATE_ICON}
        tone="accent"
        icon={<IconQuestion />}
        title="Page not found"
        text="This page does not exist."
        action={
          <Link href="/" className={LINK_PRIMARY}>
            Go home
          </Link>
        }
      />
    </main>
  );
}
