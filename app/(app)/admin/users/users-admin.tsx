"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Search, SearchX, UserPlus, Users } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { displayName, initials, invitableRoles, ROLE_LABEL, type AdminUser, type Role } from "@/lib/auth-types";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { RoleBadge, StatusBadge } from "@/components/admin/user-badges";
import { BottomSheet, EmptyState, RowGroup, Segmented, SpButton, SpField, SpInput, SpRow } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

/**
 * Users list for owners and admins. The backend already filters who I can
 * see, and says per user if I may act on them (canManage). The list comes
 * from the server; after a change, router.refresh() loads it again.
 * Actions on a user are on their page (tap the row).
 */
export function UsersAdmin({ users, myRole }: { users: AdminUser[] | null; myRole: Role }) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const shown = (users ?? []).filter(
    (u) => !q || u.email.toLowerCase().includes(q) || displayName(u).toLowerCase().includes(q)
  );
  const roles = invitableRoles(myRole);

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex gap-[8px]">
        <div className="min-w-0 flex-1">
          <SpInput
            type="search"
            icon={<Search />}
            aria-label="Search users by name or email"
            placeholder="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {roles.length > 0 && (
          <SpButton icon={<UserPlus />} className="shrink-0 px-[18px]" onClick={() => setInviteOpen(true)}>
            Invite
          </SpButton>
        )}
      </div>

      {notice && <NoticeBox notice={notice} />}

      {users === null ? (
        <EmptyState
          framed
          tone="danger"
          icon={<CloudOff />}
          title="Users could not be loaded"
          text="Please try again later."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          framed
          icon={q ? <SearchX /> : <Users />}
          title={q ? "No user matches your search" : "No users yet"}
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
        roles={roles}
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
        <span
          aria-hidden
          className={cn(
            "flex size-[33px] shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-medium",
            disabled ? "bg-(--sp-soft) text-(--sp-text-muted)" : "bg-(--sp-chip-active) text-(--sp-chip-active-text)"
          )}
        >
          {initials(user)}
        </span>
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

function InviteSheet({
  open,
  onOpenChange,
  roles,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onInvited: (email: string) => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(roles.at(-1) ?? "EMPLOYEE");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setPending(true);
    setError(null);
    try {
      await api("/admin/users", { method: "POST", body: { email, role } });
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
      description="We'll email them a link to set their password."
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
        <div className="space-y-[8px]">
          <p id="invite-role-label" className="px-[4px] text-[0.8125rem] leading-tight font-medium text-(--sp-text)">
            Role
          </p>
          {roles.length > 1 ? (
            <Segmented
              label="Role"
              surface="panel"
              value={role}
              onValueChange={(v) => setRole(v as Role)}
              items={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
            />
          ) : (
            <p className="px-[4px] text-[0.8125rem] text-(--sp-text-muted)">{ROLE_LABEL[roles[0] ?? "EMPLOYEE"]}</p>
          )}
        </div>
      </form>
    </BottomSheet>
  );
}
