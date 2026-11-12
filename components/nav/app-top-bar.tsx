"use client";

import Link from "next/link";
import { Avatar, IconBell, SpineLogo, TopBar } from "@/components/spine-ui";
import { displayName, type CurrentUser } from "@/lib/auth-types";
import { avatarDataUri, seedOf } from "@/lib/avatar";

/**
 * Top bar of every app screen (Design kit): the Spine logo left (same
 * wallet-cards icon in a rounded square as the login page and the email,
 * tap = Home); bell (unread alerts) and avatar right. No menu: every place
 * is in the dock, the home quick actions, the page headers or Settings.
 */
export function AppTopBar({ user, unread }: { user: CurrentUser; unread: number }) {
  const name = displayName(user);
  const face = avatarDataUri(seedOf(user));

  return (
    <TopBar
      left={
        <Link
          href="/"
          aria-label="Spine, home"
          className="flex size-[44px] items-center justify-center rounded-[12px] bg-(--sp-panel) text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95"
        >
          <span aria-hidden className="flex">
            <SpineLogo className="size-[20px]" />
          </span>
        </Link>
      }
      right={
        <>
          <Link
            href="/alerts"
            aria-label={unread > 0 ? `Alerts, ${unread} unread` : "Alerts"}
            className="relative inline-flex size-[44px] items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95"
          >
            <IconBell className="size-[18px]" aria-hidden />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--sp-card-front) px-1 text-[10px] leading-snug font-semibold text-white ring-2 ring-(--sp-bg)">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          <Link
            href="/settings"
            aria-label={`Your account: ${name}`}
            className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            <Avatar name={name} src={face} aria-hidden />
          </Link>
        </>
      }
    />
  );
}
