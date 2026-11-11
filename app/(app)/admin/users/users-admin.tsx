"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { displayName, invitableRoles, ROLE_LABEL, type AdminUser, type Role } from "@/lib/auth-types";
import { useDates } from "@/components/prefs/prefs-provider";
import { UserActions, type Notice } from "@/components/admin/user-actions";
import { RoleBadge, StatusBadge } from "@/components/admin/user-badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Users list for owners and admins. The backend already filters who I can
 * see, and says per user if I may act on them (canManage). The list comes
 * from the server; after a change, router.refresh() loads it again.
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
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search users"
            placeholder="Search name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
        {roles.length > 0 && (
          <Button size="lg" className="h-11 shrink-0" onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden />
            Invite
          </Button>
        )}
      </div>

      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}

      {users === null ? (
        <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Users could not be loaded. Please try again later.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((user) => (
            <UserCard key={user.id} user={user} onNotice={setNotice} />
          ))}
          {shown.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {q ? "No user matches your search." : "No users yet."}
            </p>
          )}
        </ul>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={roles}
        onInvited={(email) => setNotice({ kind: "ok", text: `Invite sent to ${email}.` })}
      />
    </div>
  );
}

function UserCard({ user, onNotice }: { user: AdminUser; onNotice: (n: Notice) => void }) {
  const dates = useDates();
  const name = displayName(user);
  return (
    <li>
      <Card size="sm">
        <CardContent className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Link
              href={`/admin/users/${encodeURIComponent(user.id)}`}
              className="flex min-h-11 flex-col justify-center rounded-md outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="truncate font-medium">{name}</span>
              {name !== user.email && <span className="truncate text-sm text-muted-foreground">{user.email}</span>}
            </Link>
            <div className="flex flex-wrap gap-1.5">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Last login {user.lastLoginAt ? dates.dateTime(user.lastLoginAt) : "never"}
            </p>
          </div>
          {user.canManage && <UserActions user={user} onNotice={onNotice} />}
        </CardContent>
      </Card>
    </li>
  );
}

function InviteDialog({
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
        if (!next) setError(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>We&apos;ll email them a link to set their password.</DialogDescription>
        </DialogHeader>
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
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel id="invite-role-label">Role</FieldLabel>
              {roles.length > 1 ? (
                <div
                  role="radiogroup"
                  aria-labelledby="invite-role-label"
                  className="grid gap-1 rounded-xl bg-muted p-1"
                  style={{ gridTemplateColumns: `repeat(${roles.length}, minmax(0, 1fr))` }}
                >
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={role === r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-lg text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        role === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{ROLE_LABEL[roles[0] ?? "EMPLOYEE"]}</p>
              )}
            </Field>
          </FieldGroup>
          <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
