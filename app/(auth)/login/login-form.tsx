"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ScanFace } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { DEFAULT_PREFERENCES, rememberPrefs, type Preferences } from "@/lib/prefs";
import { AuthHeader, OrDivider, SpButton, SpField, SpInput, SpPasswordInput } from "@/components/spine-ui";
import { usePasskeyLogin } from "@/components/auth/use-passkey-login";
import { Notice } from "../auth-ui";

export function LoginForm({ next, passwordSet }: { next: string; passwordSet: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Same end for password and passkey login. */
  async function finishLogin() {
    // Save the user's look (theme, font, size) for the next page, so it
    // paints right the first time. Not needed to log in: ignore errors.
    try {
      rememberPrefs({ ...DEFAULT_PREFERENCES, ...(await api<Partial<Preferences>>("/me/preferences")) });
    } catch {}
    // Full page load so the server guards see the new session cookie.
    window.location.assign(next);
  }

  const passkey = usePasskeyLogin({
    onSuccess: finishLogin,
    onError: (text) => setError(text),
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      // Never race the passkey options request (it would undo the login).
      await passkey.waitIdle();
      await api("/auth/login", {
        method: "POST",
        body: { email: String(form.get("email")).trim(), password: String(form.get("password")) },
      });
      await finishLogin();
    } catch (err) {
      setPending(false);
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <AuthHeader title="Welcome back" subtitle="Log in with the email your admin invited." />
      <form onSubmit={onSubmit} className="mt-[32px] space-y-[16px]">
        {passwordSet && !error && <Notice tone="success">Your password is set. You can log in now.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        <SpField label="Email" htmlFor="email">
          <SpInput
            id="email"
            name="email"
            type="email"
            // "webauthn": the phone can offer a passkey right here.
            autoComplete="username webauthn"
            inputMode="email"
            placeholder="name@nordencapital.ca"
            required
            icon={<Mail />}
          />
        </SpField>
        <SpField
          label="Password"
          htmlFor="password"
          aside={
            // 44 tall tap area; negative margin keeps the label row small.
            <Link
              href="/forgot-password"
              className="-my-[14px] -mr-[4px] inline-flex h-[44px] items-center px-[4px] text-[0.6875rem] font-medium text-(--sp-card-front) outline-none focus-visible:underline"
            >
              Forgot?
            </Link>
          }
        >
          <SpPasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
        </SpField>
        <SpButton type="submit" className="mt-[8px] w-full" disabled={pending || passkey.pending}>
          {pending ? "Logging in…" : "Log in"}
        </SpButton>
        {passkey.supported && (
          <>
            <OrDivider />
            <SpButton
              className="w-full"
              variant="secondary"
              icon={<ScanFace aria-hidden />}
              onClick={() => {
                setError(null);
                void passkey.start();
              }}
              disabled={!passkey.ready || passkey.pending || pending}
            >
              {passkey.pending ? "Waiting for Face ID…" : "Log in with Face ID"}
            </SpButton>
          </>
        )}
      </form>
      <p className="mt-[32px] text-center text-[0.6875rem] leading-snug text-(--sp-text-muted)">
        No account? Ask your admin for an invite.
      </p>
    </div>
  );
}
