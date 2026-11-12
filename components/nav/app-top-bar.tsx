"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, Settings, Shapes, Trash2, Users, Wallet } from "lucide-react";
import { Avatar, IconButton, TopBar } from "@/components/spine-ui";
import { LogoutDialog } from "@/components/auth/logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canSeeUsers, displayName, type CurrentUser } from "@/lib/auth-types";

const ITEM = "min-h-11 gap-3 px-3 text-base";

/**
 * Top bar of every app screen (Design kit): menu button left; bell (unread
 * alerts) and avatar right. The menu holds the links that are not in the dock.
 */
export function AppTopBar({ user, unread }: { user: CurrentUser; unread: number }) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const name = displayName(user);
  const manager = canSeeUsers(user.role);

  return (
    <>
      <TopBar
        left={
          <DropdownMenu>
            <DropdownMenuTrigger render={<IconButton label="Menu" icon={<Menu />} />} />
            <DropdownMenuContent align="start" className="w-64 max-w-[calc(100vw-2rem)]">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2">
                  <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                  {name !== user.email && <span className="block truncate">{user.email}</span>}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={ITEM} render={<Link href="/wallet" />}>
                <Wallet aria-hidden />
                Personal wallet
              </DropdownMenuItem>
              <DropdownMenuItem className={ITEM} render={<Link href="/settings/account" />}>
                <Settings aria-hidden />
                Settings
              </DropdownMenuItem>
              {manager && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className={ITEM} render={<Link href="/admin/users" />}>
                    <Users aria-hidden />
                    Users
                  </DropdownMenuItem>
                  <DropdownMenuItem className={ITEM} render={<Link href="/admin/categories" />}>
                    <Shapes aria-hidden />
                    Categories &amp; tags
                  </DropdownMenuItem>
                  <DropdownMenuItem className={ITEM} render={<Link href="/admin/trash" />}>
                    <Trash2 aria-hidden />
                    Trash
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className={ITEM} variant="destructive" onClick={() => setLogoutOpen(true)}>
                <LogOut aria-hidden />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              href="/settings/account"
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
