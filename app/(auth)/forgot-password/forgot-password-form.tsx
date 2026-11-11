"use client";

import { useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>We will email you a link to choose a new password.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {sent ? (
          <Alert>
            <AlertDescription>
              If this email has an account, we sent a link to it. Check your inbox.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
            </FieldGroup>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
              {pending ? "Sending…" : "Send link"}
            </Button>
          </form>
        )}
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
