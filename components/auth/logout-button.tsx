"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";

// Logout asks first: a tap by mistake must not end the session.
export function LogoutButton(props: Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Even if the call fails, leave the app; the server guard re-checks.
    }
    // Full page load on purpose: it drops every cached page of the old
    // session. The dialog stays open ("Logging out…") until /login shows.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" {...props} />}>Log out</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out?</AlertDialogTitle>
          <AlertDialogDescription>You will need to log in again.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg" className="h-11" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <Button variant="destructive" size="lg" className="h-11" onClick={logout} disabled={pending}>
            {pending ? "Logging out…" : "Log out"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
