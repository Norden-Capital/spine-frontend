"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";

const MIN_LENGTH = 12;

export type TokenInfo = { email: string; purpose: "INVITE" | "RESET" };
/** Result of the token check, done on the server before the page renders. */
export type TokenCheck = { kind: "invalid" } | { kind: "error" } | { kind: "ready"; info: TokenInfo };

export function SetPasswordForm({ token, check }: { token: string; check: TokenCheck }) {
  const [invalid, setInvalid] = useState(false);

  if (invalid || check.kind === "invalid") return <InvalidLink />;
  if (check.kind === "error") {
    return (
      <Alert variant="destructive">
        <AlertDescription>Can&apos;t check this link right now. Please try again later.</AlertDescription>
      </Alert>
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
    <Card>
      <CardHeader>
        <CardTitle>{isInvite ? "Create your password" : "Choose a new password"}</CardTitle>
        <CardDescription>
          For <span className="font-medium text-foreground">{info.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {/* Lets password managers save the right account. */}
          <input type="email" name="username" value={info.email} autoComplete="username" readOnly hidden />
          <FieldGroup>
            <Field data-invalid={touched && tooShort}>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                placeholder={`At least ${MIN_LENGTH} characters`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={touched && tooShort}
              />
              {touched && tooShort ? (
                <FieldError>Use at least {MIN_LENGTH} characters.</FieldError>
              ) : (
                <FieldDescription>At least {MIN_LENGTH} characters.</FieldDescription>
              )}
            </Field>
            <Field data-invalid={touched && mismatch}>
              <FieldLabel htmlFor="confirm">Repeat password</FieldLabel>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                placeholder="Repeat the password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={touched && mismatch}
              />
              {touched && mismatch && <FieldError>The passwords are not the same.</FieldError>}
            </Field>
          </FieldGroup>
          <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
            {pending ? "Saving…" : "Save password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InvalidLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>This link does not work</CardTitle>
        <CardDescription>
          It has expired or was already used. Ask your admin for a new invite, or request a new
          reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Link href="/forgot-password" className={buttonVariants({ size: "lg", className: "h-11 w-full" })}>
          Get a new reset link
        </Link>
        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </CardContent>
    </Card>
  );
}
