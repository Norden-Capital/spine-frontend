"use client";

import { useState } from "react";
import { IconLogout } from "@/components/spine-ui";
import { BottomSheet, SpButton } from "@/components/spine-ui";
import { api } from "@/lib/api";
import { forgetPushDevice } from "@/lib/push";
import { cn } from "@/lib/utils";

/** "Log out?" confirm (bottom sheet). Logout asks first: a tap by mistake must not end the session. */
export function LogoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    // Stop this device's notifications for this person (the browser keeps its
    // subscription: the next person who logs in here sends it again).
    await forgetPushDevice().catch(() => {});
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Even if the call fails, leave the app; the server guard re-checks.
    }
    // Keep the look saved on this device (theme, font, size), so the login
    // page stays in the user's theme. Account data goes with the session.
    // Full page load on purpose: it drops every cached page of the old
    // session. The sheet stays open ("Logging out…") until /login shows.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title="Log out?"
      description="You will need to log in again."
      footer={
        <div className="space-y-[8px]">
          <SpButton className="w-full" variant="danger" icon={<IconLogout aria-hidden />} onClick={logout} disabled={pending}>
            {pending ? "Logging out…" : "Log out"}
          </SpButton>
          <SpButton className="w-full" variant="secondary" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </SpButton>
        </div>
      }
    >
      {null}
    </BottomSheet>
  );
}

/** Full-width red-text "Log out" button (bottom of Settings > Account) that opens the confirm sheet. */
export function LogoutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SpButton className={cn("w-full", className)} variant="danger" icon={<IconLogout aria-hidden />} onClick={() => setOpen(true)}>
        Log out
      </SpButton>
      <LogoutDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
