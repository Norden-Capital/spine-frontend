"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayName, initials, type CurrentUser } from "@/lib/auth-types";
import { LogoutDialog } from "./logout-button";

const ITEM = "min-h-11 gap-3 px-3 text-base";

/** Header button with the user's initials + name; opens Settings / Log out. */
export function UserMenu({ user }: { user: CurrentUser }) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const name = displayName(user);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Account menu for ${name}`}
          className="flex h-11 max-w-[55vw] items-center gap-2 rounded-full pr-2 pl-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted"
        >
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background"
          >
            {initials(user)}
          </span>
          <span className="truncate text-sm font-medium">{name}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-3 py-2">
              <span className="block truncate text-sm font-medium text-foreground">{name}</span>
              {name !== user.email && <span className="block truncate">{user.email}</span>}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className={ITEM} render={<Link href="/settings/account" />}>
            <Settings aria-hidden />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className={ITEM} variant="destructive" onClick={() => setLogoutOpen(true)}>
            <LogOut aria-hidden />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
