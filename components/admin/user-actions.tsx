"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, KeyRound, LogOut, Mail, X } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { displayName, type AdminUser } from "@/lib/auth-types";
import { RowGroup, RowIcon, SpRow } from "@/components/spine-ui";
import { ConfirmSheet } from "./confirm-sheet";
import type { Notice } from "./notice";

export type { Notice } from "./notice";

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

/** Red icon circle for the destructive row (light red fill, red icon). */
function DangerIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sp-danger)_14%,var(--sp-panel))] text-(--sp-danger) [&_svg]:size-[15px] [&_svg]:stroke-[1.7]">
      {children}
    </span>
  );
}

/**
 * "Manage" rows with what I can do to a user. Only shown when the backend
 * says canManage. Every action asks first (bottom sheet); after it, the
 * page data reloads from the server. The role is not changed here (it is
 * picked at invite).
 */
export function UserActions({ user, onNotice }: { user: AdminUser; onNotice: (notice: Notice) => void }) {
  const router = useRouter();
  // The last chosen action stays set while the sheet slides out.
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

  const none = <span />;

  return (
    <>
      <RowGroup title="Manage">
        {user.status === "INVITED" && (
          <SpRow
            leading={<RowIcon><Mail /></RowIcon>}
            title="Send the invite again"
            subtitle="They have not set a password yet."
            onClick={() => ask(actions.resend)}
            trailing={none}
          />
        )}
        {user.status === "ACTIVE" && (
          <>
            <SpRow
              leading={<RowIcon><KeyRound /></RowIcon>}
              title="Send reset password email"
              onClick={() => ask(actions.reset)}
              trailing={none}
            />
            <SpRow
              leading={<RowIcon><LogOut /></RowIcon>}
              title="Log out on all devices"
              onClick={() => ask(actions.logoutAll)}
              trailing={none}
            />
          </>
        )}
        {user.status === "DISABLED" ? (
          <SpRow
            leading={<RowIcon><CircleCheck /></RowIcon>}
            title="Enable this user"
            subtitle="They can log in again."
            onClick={() => ask(actions.enable)}
            trailing={none}
          />
        ) : (
          <SpRow
            leading={<DangerIcon><X /></DangerIcon>}
            title={<span className="text-(--sp-danger)">Disable this user</span>}
            subtitle="They can no longer log in. You can undo it."
            onClick={() => ask(actions.disable)}
            trailing={none}
          />
        )}
      </RowGroup>

      <ConfirmSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        title={action?.title ?? ""}
        text={action?.text ?? ""}
        confirm={action?.confirm ?? ""}
        destructive={action?.destructive}
        busy={pending}
        onConfirm={confirm}
      />
    </>
  );
}
