"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMail } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { AuthHeader, SpButton, SpField, SpInput } from "@/components/spine-ui";
import { AUTH_HEADER_CENTER, linkButton, Notice } from "../auth-ui";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: String(form.get("email")).trim() },
      });
      setSent(true);
    } catch (err) {
      // The backend always answers 202, so an error here is a real failure
      // (network, server down, rate limit). Never say if the email exists.
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  const back = (
    <Link href="/login" className={linkButton("secondary", "flex w-full")}>
      Back to log in
    </Link>
  );

  return (
    <div>
      <AuthHeader className={AUTH_HEADER_CENTER} title="Forgot password?" subtitle="We email you a link to choose a new password." />
      {sent ? (
        <div className="mt-[32px] space-y-[16px]">
          <Notice tone="success">If this email has an account, we sent a link to it. Check your inbox.</Notice>
          {back}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-[32px] space-y-[16px]">
          {error && <Notice tone="danger">{error}</Notice>}
          <SpField label="Email" htmlFor="email">
            <SpInput
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="name@nordencapital.ca"
              required
              icon={<IconMail />}
            />
          </SpField>
          <SpButton type="submit" className="mt-[8px] w-full" disabled={pending}>
            {pending ? "Sending…" : "Send link"}
          </SpButton>
          {back}
        </form>
      )}
    </div>
  );
}
