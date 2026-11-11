"use client";

import { useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { AdminUser, Role, UserStatus } from "@/lib/auth-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { NotAllowed } from "@/components/auth/not-allowed";

type Notice = { kind: "ok" | "error"; text: string } | null;

export function UsersAdmin({
  currentUserId,
  initialUsers,
}: {
  currentUserId: string;
  /** Loaded on the server; null if that load failed. */
  initialUsers: AdminUser[] | null;
}) {
  const [users, setUsers] = useState<AdminUser[] | null>(initialUsers);
  const [loadError, setLoadError] = useState(initialUsers === null);
  const [forbidden, setForbidden] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  // Reload after a change. 401: api() already sends the user to /login.
  async function load() {
    try {
      setUsers(await api<AdminUser[]>("/admin/users"));
      setLoadError(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "unauthorized") return;
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        return;
      }
      setLoadError(true);
    }
  }

  async function run(action: () => Promise<unknown>, okText: string) {
    setNotice(null);
    try {
      await action();
      setNotice({ kind: "ok", text: okText });
      await load();
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
      // The list is out of date (user removed, role changed elsewhere...).
      if (err instanceof ApiError && (err.code === "user_not_found" || err.status === 409)) {
        await load();
      }
    }
  }

  if (forbidden) return <NotAllowed />;

  return (
    <div className="flex flex-col gap-6">
      <InviteForm onInvited={(email) => run(async () => undefined, `Invite sent to ${email}.`)} />

      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}

      {loadError && (
        <Alert variant="destructive">
          <AlertDescription>
            Could not load users.{" "}
            <button className="underline" onClick={() => void load()}>
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {users && (
        <ul className="flex flex-col gap-3">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isMe={String(user.id) === currentUserId}
              onRole={(role) =>
                run(() => api(`/admin/users/${user.id}`, { method: "PATCH", body: { role } }), `Role changed for ${user.email}.`)
              }
              onStatus={(status) =>
                run(
                  () => api(`/admin/users/${user.id}`, { method: "PATCH", body: { status } }),
                  status === "DISABLED" ? `${user.email} is disabled.` : `${user.email} is enabled.`
                )
              }
              onResend={() =>
                run(() => api(`/admin/users/${user.id}/resend-invite`, { method: "POST" }), `Invite sent again to ${user.email}.`)
              }
            />
          ))}
          {users.length === 0 && <p className="text-sm text-muted-foreground">No users yet.</p>}
        </ul>
      )}
    </div>
  );
}

function InviteForm({ onInvited }: { onInvited: (email: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const email = String(form.get("email")).trim();
    const role = String(form.get("role")) as Role;
    setPending(true);
    setError(null);
    try {
      await api("/admin/users", { method: "POST", body: { email, role } });
      formEl.reset();
      onInvited(email);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite a user</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="name@nordencapital.ca"
                required
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <NativeSelect id="invite-role" name="role" defaultValue="EMPLOYEE" className="w-full">
                <NativeSelectOption value="EMPLOYEE">Employee</NativeSelectOption>
                <NativeSelectOption value="ADMIN">Admin</NativeSelectOption>
              </NativeSelect>
            </Field>
          </FieldGroup>
          <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const STATUS_VARIANT: Record<UserStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "secondary",
  INVITED: "outline",
  DISABLED: "destructive",
};

function formatDate(value: string | null): string {
  if (!value) return "never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function UserRow({
  user,
  isMe,
  onRole,
  onStatus,
  onResend,
}: {
  user: AdminUser;
  isMe: boolean;
  onRole: (role: Role) => Promise<void>;
  onStatus: (status: UserStatus) => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  const disabled = user.status === "DISABLED";

  return (
    <li>
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="font-medium break-all">
              {user.email}
              {isMe && <span className="ml-1 text-muted-foreground">(you)</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
              <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Last login: {formatDate(user.lastLoginAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label={`Role for ${user.email}`}
              value={user.role}
              disabled={busy}
              onChange={(e) => act(() => onRole(e.target.value as Role))}
            >
              <NativeSelectOption value="EMPLOYEE">Employee</NativeSelectOption>
              <NativeSelectOption value="ADMIN">Admin</NativeSelectOption>
            </NativeSelect>
            {user.status === "INVITED" && (
              <Button variant="outline" disabled={busy} onClick={() => act(onResend)}>
                Resend invite
              </Button>
            )}
            {disabled ? (
              <Button variant="outline" disabled={busy} onClick={() => act(() => onStatus("ACTIVE"))}>
                Enable
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Disable ${user.email}? They will not be able to log in.`)) {
                    void act(() => onStatus("DISABLED"));
                  }
                }}
              >
                Disable
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
