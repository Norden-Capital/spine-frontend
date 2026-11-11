"use client";

import { useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import { DEFAULT_PREFERENCES, rememberPrefs, type Preferences } from "@/lib/prefs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";

export function LoginForm({ next, passwordSet }: { next: string; passwordSet: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api("/auth/login", {
        method: "POST",
        body: { email: String(form.get("email")).trim(), password: String(form.get("password")) },
      });
      // Save the user's look (theme, font, size) for the next page, so it
      // paints right the first time. Not needed to log in: ignore errors.
      try {
        rememberPrefs({ ...DEFAULT_PREFERENCES, ...(await api<Partial<Preferences>>("/me/preferences")) });
      } catch {}
      // Full page load so the server guards see the new session cookie.
      window.location.assign(next);
    } catch (err) {
      setPending(false);
      setError(errorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Use the email your admin invited.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {passwordSet && !error && (
            <Alert>
              <AlertDescription>Your password is set. You can log in now.</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder="name@nordencapital.ca"
                required
                className="h-11 text-base"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
            </Field>
          </FieldGroup>
          <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
            {pending ? "Logging in…" : "Log in"}
          </Button>
          <Link
            href="/forgot-password"
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
