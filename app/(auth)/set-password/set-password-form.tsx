"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudOff, Mail } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { AuthHeader, EmptyState, SpButton, SpField, SpPasswordInput } from "@/components/spine-ui";
import { linkButton, Notice } from "../auth-ui";

const MIN_LENGTH = 12;

export type TokenInfo = { email: string; purpose: "INVITE" | "RESET" };
/** Result of the token check, done on the server before the page renders. */
export type TokenCheck = { kind: "invalid" } | { kind: "error" } | { kind: "ready"; info: TokenInfo };

export function SetPasswordForm({ token, check }: { token: string; check: TokenCheck }) {
  const [invalid, setInvalid] = useState(false);

  if (invalid || check.kind === "invalid") return <InvalidLink />;
  if (check.kind === "error") {
    return (
      <CenteredState>
        <EmptyState
          tone="danger"
          icon={<CloudOff />}
          title="Can't check this link right now"
          text="Please try again later."
          action={
            <Link href="/login" className={linkButton("secondary")}>
              Back to log in
            </Link>
          }
        />
      </CenteredState>
    );
  }
  return <PasswordForm token={token} info={check.info} onInvalid={() => setInvalid(true)} />;
}

function PasswordForm({
  token,
  info,
  onInvalid,
}: {
  token: string;
  info: TokenInfo;
  onInvalid: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const tooShort = password.length < MIN_LENGTH;
  const mismatch = confirm !== password;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (tooShort || mismatch) return;
    setPending(true);
    setError(null);
    try {
      await api("/auth/set-password", { method: "POST", body: { token, password } });
      router.replace("/login?password=set");
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && (err.code === "token_invalid" || err.status === 410)) {
        onInvalid();
      } else if (err instanceof ApiError && err.code === "weak_password") {
        setError(`This password is too weak. Use at least ${MIN_LENGTH} characters.`);
      } else {
        setError(errorMessage(err));
      }
    }
  }

  const isInvite = info.purpose === "INVITE";

  return (
    <div>
      <AuthHeader
        title={isInvite ? "Create your password" : "Choose a new password"}
        subtitle={`For ${info.email}. You use it to log in to Spine.`}
      />
      <form onSubmit={onSubmit} className="mt-[32px] space-y-[16px]" noValidate>
        {error && <Notice tone="danger">{error}</Notice>}
        {/* Lets password managers save the right account. */}
        <input type="email" name="username" value={info.email} autoComplete="username" readOnly hidden />
        <SpField
          label="New password"
          htmlFor="password"
          hint={`At least ${MIN_LENGTH} characters.`}
          error={touched && tooShort ? `Use at least ${MIN_LENGTH} characters.` : undefined}
        >
          <SpPasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_LENGTH} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={touched && tooShort}
          />
        </SpField>
        <SpField
          label="Repeat the password"
          htmlFor="confirm"
          error={touched && mismatch ? "The passwords are not the same." : undefined}
        >
          <SpPasswordInput
            id="confirm"
            autoComplete="new-password"
            placeholder="Repeat the password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={touched && mismatch}
          />
        </SpField>
        <SpButton type="submit" className="mt-[8px] w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </SpButton>
        <Link href="/login" className={linkButton("secondary", "flex w-full")}>
          Back to log in
        </Link>
      </form>
    </div>
  );
}

/** Fills the screen and puts the state in the middle (same as the 404 / error pages). */
function CenteredState({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center">{children}</div>;
}

function InvalidLink() {
  return (
    <CenteredState>
      <EmptyState
        tone="danger"
        icon={<Mail />}
        title="This link does not work"
        text="It has expired or was already used. Ask your admin for a new invite, or request a new reset link."
        action={
          <div className="flex w-full flex-col gap-[10px]">
            <Link href="/forgot-password" className={linkButton("primary", "flex w-full")}>
              Get a new reset link
            </Link>
            <Link href="/login" className={linkButton("secondary", "flex w-full")}>
              Back to log in
            </Link>
          </div>
        }
        className="w-full"
      />
    </CenteredState>
  );
}
