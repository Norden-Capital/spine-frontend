"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, LogOut, Menu, Settings, Shapes, Trash2, Users, Wallet, X } from "lucide-react";
import { Avatar, IconButton, TopBar } from "@/components/spine-ui";
import { LogoutDialog } from "@/components/auth/logout-button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { canSeeUsers, displayName, type CurrentUser } from "@/lib/auth-types";

/** A swipe to the left longer than this (px) closes the menu. */
const SWIPE_CLOSE = 60;

const ROW =
  "flex min-h-[52px] w-full items-center gap-[12px] rounded-[16px] px-[12px] text-left text-[0.875rem] font-medium outline-none transition hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.99]";
const ICON =
  "flex size-[33px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) [&_svg]:size-[16px] [&_svg]:stroke-[1.7]";

function MenuLink({
  href,
  icon,
  label,
  onPick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onPick: () => void;
}) {
  return (
    <Link href={href} onClick={onPick} className={`${ROW} text-(--sp-text)`}>
      <span className={ICON}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight aria-hidden className="size-[18px] shrink-0 stroke-[1.8] text-(--sp-text-faint)" />
    </Link>
  );
}

/**
 * Top bar of every app screen (Design kit): menu button left; bell (unread
 * alerts) and avatar right. The menu is a sheet from the left (over the
 * page, the page does not move) with the links that are not in the dock.
 */
export function AppTopBar({ user, unread }: { user: CurrentUser; unread: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const name = displayName(user);
  const manager = canSeeUsers(user.role);
  const close = () => setMenuOpen(false);

  return (
    <>
      <TopBar
        left={
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger render={<IconButton label="Menu" icon={<Menu />} />} />
            <SheetContent
              side="left"
              showCloseButton={false}
              className="sp gap-0 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+12px)] pl-[calc(env(safe-area-inset-left)+12px)] pr-[12px]"
              onTouchStart={(e) => {
                const t = e.touches[0];
                swipeStart.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                const start = swipeStart.current;
                swipeStart.current = null;
                const t = e.changedTouches[0];
                if (!start || !t) return;
                const dx = t.clientX - start.x;
                if (dx < -SWIPE_CLOSE && Math.abs(dx) > Math.abs(t.clientY - start.y)) close();
              }}
            >
              <div className="flex items-center gap-[12px] px-[4px] pb-[16px]">
                <Avatar name={name} aria-hidden />
                <div className="min-w-0 flex-1 leading-tight">
                  <SheetTitle className="truncate text-[0.9375rem] font-medium text-(--sp-text)">{name}</SheetTitle>
                  <SheetDescription className="mt-[3px] truncate text-[0.6875rem] text-(--sp-text-muted)">
                    {name !== user.email ? user.email : "Menu"}
                  </SheetDescription>
                </div>
                <SheetClose render={<IconButton label="Close menu" icon={<X />} variant="ghost" />} />
              </div>

              <nav aria-label="Menu" className="flex min-h-0 flex-1 flex-col gap-[4px] overflow-y-auto">
                <MenuLink href="/wallet" icon={<Wallet aria-hidden />} label="Personal wallet" onPick={close} />
                <MenuLink href="/settings" icon={<Settings aria-hidden />} label="Settings" onPick={close} />
                {manager && (
                  <>
                    <p className="px-[12px] pt-[16px] pb-[6px] text-[0.6875rem] font-medium text-(--sp-text-muted)">
                      Admin
                    </p>
                    <MenuLink href="/admin/users" icon={<Users aria-hidden />} label="Users" onPick={close} />
                    <MenuLink
                      href="/admin/categories"
                      icon={<Shapes aria-hidden />}
                      label="Categories & tags"
                      onPick={close}
                    />
                    <MenuLink href="/admin/trash" icon={<Trash2 aria-hidden />} label="Trash" onPick={close} />
                  </>
                )}
              </nav>

              <button
                type="button"
                onClick={() => {
                  close();
                  setLogoutOpen(true);
                }}
                className={`${ROW} mt-[12px] shrink-0 justify-center bg-[color-mix(in_oklab,var(--sp-danger)_10%,transparent)] text-(--sp-danger) hover:bg-[color-mix(in_oklab,var(--sp-danger)_15%,transparent)] [&_svg]:size-[18px] [&_svg]:stroke-[1.8]`}
              >
                <LogOut aria-hidden />
                Log out
              </button>
            </SheetContent>
          </Sheet>
        }
        right={
          <>
            <Link
              href="/alerts"
              aria-label={unread > 0 ? `Alerts, ${unread} unread` : "Alerts"}
              className="relative inline-flex size-[44px] items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95"
            >
              <Bell className="size-[18px] stroke-[1.6]" aria-hidden />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--sp-card-front) px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-(--sp-bg)">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              aria-label={`Your account: ${name}`}
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
            >
              <Avatar name={name} aria-hidden />
            </Link>
          </>
        }
      />
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
