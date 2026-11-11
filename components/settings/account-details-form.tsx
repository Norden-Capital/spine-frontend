"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const MAX = 100;

/** "Your details": first and last name can change; email is read-only. */
export function AccountDetailsForm({
  email,
  firstName,
  lastName,
}: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const router = useRouter();
  const [first, setFirst] = useState(firstName ?? "");
  const [last, setLast] = useState(lastName ?? "");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [fieldError, setFieldError] = useState<{ field: string; text: string } | null>(null);

  const changed = first.trim() !== (firstName ?? "") || last.trim() !== (lastName ?? "");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setFieldError(null);
    try {
      await api("/me", {
        method: "PATCH",
        body: { firstName: first.trim() || null, lastName: last.trim() || null },
      });
      setNotice({ kind: "ok", text: "Saved." });
      // Server parts (header name, home page) show the new name.
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.field) {
        setFieldError({ field: err.field, text: err.message });
      } else {
        setNotice({ kind: "error", text: errorMessage(err) });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field data-invalid={fieldError?.field === "firstName"}>
          <FieldLabel htmlFor="first-name">First name</FieldLabel>
          <Input
            id="first-name"
            autoComplete="given-name"
            placeholder="Your first name"
            maxLength={MAX}
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            aria-invalid={fieldError?.field === "firstName"}
            className="h-11"
          />
          {fieldError?.field === "firstName" && <FieldError>{fieldError.text}</FieldError>}
        </Field>
        <Field data-invalid={fieldError?.field === "lastName"}>
          <FieldLabel htmlFor="last-name">Last name</FieldLabel>
          <Input
            id="last-name"
            autoComplete="family-name"
            placeholder="Your last name"
            maxLength={MAX}
            value={last}
            onChange={(e) => setLast(e.target.value)}
            aria-invalid={fieldError?.field === "lastName"}
            className="h-11"
          />
          {fieldError?.field === "lastName" && <FieldError>{fieldError.text}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" value={email} readOnly disabled className="h-11" />
          <FieldDescription>Only an admin can change your email.</FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending || !changed}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
