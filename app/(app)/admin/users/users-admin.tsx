"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconNoResults, IconOffline, IconSearch, IconUserAdd, IconUsers } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { displayName, type AdminUser } from "@/lib/auth-types";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { RoleBadge, StatusBadge } from "@/components/admin/user-badges";
import { BottomSheet, EmptyState, RowGroup, SpButton, SpField, SpInput, SpRow } from "@/components/spine-ui";
import { UserAvatar } from "@/components/nav/user-avatar";
import { seedOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";

/**
 * Users list for the owner: every member (never the owner). The backend
 * says per user if I may act on them (canManage). The list comes
 * from the server; after a change, router.refresh() loads it again.
 * Actions on a user are on their page (tap the row).
 */
export function UsersAdmin({ users }: { users: AdminUser[] | null }) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const shown = (users ?? []).filter(
    (u) => !q || u.email.toLowerCase().includes(q) || displayName(u).toLowerCase().includes(q)
  );

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex gap-[8px]">
        <div className="min-w-0 flex-1">
          <SpInput
            type="search"
            icon={<IconSearch />}
            aria-label="Search users by name or email"
            placeholder="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <SpButton icon={<IconUserAdd />} className="shrink-0 px-[18px]" onClick={() => setInviteOpen(true)}>
          Invite
        </SpButton>
      </div>

      {notice && <NoticeBox notice={notice} />}

      {users === null ? (
        <EmptyState
          framed
          tone="danger"
          icon={<IconOffline />}
          title="Users could not be loaded"
          text="Please try again later."
        />
      ) : shown.length === 0 ? (
        <PageEmpty
          icon={q ? <IconNoResults /> : <IconUsers />}
          title={q ? "No user matches your search" : "No members yet"}
        />
      ) : (
        <RowGroup>
          <ul>
            {shown.map((user) => (
              <li key={user.id}>
                <UserRow user={user} />
              </li>
            ))}
          </ul>
        </RowGroup>
      )}

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={(email) => setNotice({ kind: "ok", text: `Invite sent to ${email}.` })}
      />
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const name = displayName(user);
  const disabled = user.status === "DISABLED";
  return (
    <SpRow
      href={`/admin/users/${encodeURIComponent(user.id)}`}
      leading={
        <UserAvatar seed={seedOf(user)} size={33} className={cn(disabled && "opacity-50")} />
      }
      title={name}
      subtitle={name !== user.email ? user.email : undefined}
      muted={disabled}
      trailing={
        <span className="flex shrink-0 flex-col items-end gap-[4px]">
          <RoleBadge role={user.role} />
          {user.status !== "ACTIVE" && <StatusBadge status={user.status} />}
        </span>
      }
    />
  );
}

/** Invite by email only: a new user is always a Member (no role to pick). */
function InviteSheet({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: (email: string) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setPending(true);
    setError(null);
    try {
      await api("/admin/users", { method: "POST", body: { email } });
      onOpenChange(false);
      onInvited(email);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
        if (!next) setError(null);
      }}
      title="Invite a user"
      description="We'll email them a link to set their password. They join as a Member."
      footer={
        <SpButton type="submit" form="invite-form" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send invite"}
        </SpButton>
      }
    >
      <form id="invite-form" onSubmit={onSubmit} className="flex flex-col gap-[16px] pt-[4px]">
        {error && <NoticeBox notice={{ kind: "error", text: error }} />}
        <SpField label="Email" htmlFor="invite-email">
          <SpInput
            id="invite-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="name@nordencapital.ca"
            required
            surface="panel"
          />
        </SpField>
      </form>
    </BottomSheet>
  );
}
