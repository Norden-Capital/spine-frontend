"use client";

import { useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/auth/password-input";

const MIN_LENGTH = 12;

/** Change password. This session stays; the backend logs out other devices. */
export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const tooShort = next.length < MIN_LENGTH;
  const mismatch = repeat !== next;
  const missingCurrent = current.length === 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setNotice(null);
    setCurrentError(null);
    if (missingCurrent || tooShort || mismatch) return;
    setPending(true);
    try {
      await api("/me/password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      setCurrent("");
      setNext("");
      setRepeat("");
      setTouched(false);
      setNotice({ kind: "ok", text: "Password changed. Other devices are logged out." });
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_current_password") {
        setCurrentError(err.message);
      } else if (err instanceof ApiError && err.code === "weak_password") {
        setNotice({ kind: "error", text: `This password is too weak. Use at least ${MIN_LENGTH} characters.` });
      } else {
        setNotice({ kind: "error", text: errorMessage(err) });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field data-invalid={Boolean(currentError) || (touched && missingCurrent)}>
          <FieldLabel htmlFor="current-password">Current password</FieldLabel>
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            placeholder="Your current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            aria-invalid={Boolean(currentError) || (touched && missingCurrent)}
          />
          {currentError ? (
            <FieldError>{currentError}</FieldError>
          ) : (
            touched && missingCurrent && <FieldError>Enter your current password.</FieldError>
          )}
        </Field>
        <Field data-invalid={touched && tooShort}>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_LENGTH} characters`}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            aria-invalid={touched && tooShort}
          />
          {touched && tooShort ? (
            <FieldError>Use at least {MIN_LENGTH} characters.</FieldError>
          ) : (
            <FieldDescription>At least {MIN_LENGTH} characters.</FieldDescription>
          )}
        </Field>
        <Field data-invalid={touched && mismatch}>
          <FieldLabel htmlFor="repeat-password">Repeat new password</FieldLabel>
          <PasswordInput
            id="repeat-password"
            autoComplete="new-password"
            placeholder="Repeat the password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            aria-invalid={touched && mismatch}
          />
          {touched && mismatch && <FieldError>The passwords are not the same.</FieldError>}
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
