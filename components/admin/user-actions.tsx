"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, CircleCheck, Eye, KeyRound, LogOut, Mail, MoreHorizontal } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { displayName, type AdminUser } from "@/lib/auth-types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Notice = { kind: "ok" | "error"; text: string };

type Action = {
  title: string;
  text: string;
  confirm: string;
  destructive?: boolean;
  run: () => Promise<unknown>;
  done: string;
};

function actionsFor(user: AdminUser) {
  const name = displayName(user);
  const path = `/admin/users/${encodeURIComponent(user.id)}`;
  return {
    disable: {
      title: `Disable ${name}?`,
      text: "They are logged out and can't log in until you enable them again.",
      confirm: "Disable",
      destructive: true,
      run: () => api(`${path}/disable`, { method: "POST" }),
      done: `${name} is disabled.`,
    },
    enable: {
      title: `Enable ${name}?`,
      text: "They can log in again.",
      confirm: "Enable",
      run: () => api(`${path}/enable`, { method: "POST" }),
      done: `${name} is enabled.`,
    },
    logoutAll: {
      title: "Log out all sessions?",
      text: `${name} is logged out on every device. They can log in again.`,
      confirm: "Log out all",
      run: () => api(`${path}/logout-all`, { method: "POST" }),
      done: `${name} is logged out everywhere.`,
    },
    reset: {
      title: "Send a reset password email?",
      text: `We'll email ${user.email} a link to set a new password.`,
      confirm: "Send email",
      run: () => api(`${path}/reset-password`, { method: "POST" }),
      done: `Reset email sent to ${user.email}.`,
    },
    resend: {
      title: "Send the invite again?",
      text: `We'll email ${user.email} a new invite link.`,
      confirm: "Send invite",
      run: () => api(`${path}/resend-invite`, { method: "POST" }),
      done: `Invite sent again to ${user.email}.`,
    },
  } satisfies Record<string, Action>;
}

const ITEM = "min-h-11 gap-3 px-3 text-base";

/**
 * "…" menu with what I can do to a user. Only shown when the backend says
 * canManage. Every action asks first (AlertDialog); after it, the page data
 * reloads from the server.
 */
export function UserActions({
  user,
  showView = true,
  onNotice,
}: {
  user: AdminUser;
  showView?: boolean;
  onNotice: (notice: Notice) => void;
}) {
  const router = useRouter();
  // The last chosen action stays set while the dialog fades out.
  const [action, setAction] = useState<Action | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const actions = actionsFor(user);

  function ask(next: Action) {
    setAction(next);
    setIsOpen(true);
  }

  async function confirm() {
    if (!action) return;
    setPending(true);
    try {
      await action.run();
      onNotice({ kind: "ok", text: action.done });
    } catch (err) {
      onNotice({ kind: "error", text: errorMessage(err) });
    } finally {
      setPending(false);
      setIsOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-11 shrink-0" />}
          aria-label={`Actions for ${displayName(user)}`}
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
          {showView && (
            <>
              <DropdownMenuItem className={ITEM} render={<Link href={`/admin/users/${encodeURIComponent(user.id)}`} />}>
                <Eye aria-hidden />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {user.status === "INVITED" && (
            <DropdownMenuItem className={ITEM} onClick={() => ask(actions.resend)}>
              <Mail aria-hidden />
              Resend invite
            </DropdownMenuItem>
          )}
          {user.status === "ACTIVE" && (
            <>
              <DropdownMenuItem className={ITEM} onClick={() => ask(actions.reset)}>
                <KeyRound aria-hidden />
                Send reset password email
              </DropdownMenuItem>
              <DropdownMenuItem className={ITEM} onClick={() => ask(actions.logoutAll)}>
                <LogOut aria-hidden />
                Log out all sessions
              </DropdownMenuItem>
            </>
          )}
          {user.status === "DISABLED" ? (
            <DropdownMenuItem className={ITEM} onClick={() => ask(actions.enable)}>
              <CircleCheck aria-hidden />
              Enable
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className={ITEM} variant="destructive" onClick={() => ask(actions.disable)}>
              <Ban aria-hidden />
              Disable
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isOpen} onOpenChange={(next) => !next && !pending && setIsOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action?.title}</AlertDialogTitle>
            <AlertDialogDescription>{action?.text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-11" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant={action?.destructive ? "destructive" : "default"}
              size="lg"
              className="h-11"
              onClick={confirm}
              disabled={pending}
            >
              {pending ? "Please wait…" : action?.confirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
