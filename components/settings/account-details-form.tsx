"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLock } from "@/components/spine-ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { SpButton, SpField, SpInput } from "@/components/spine-ui";
import { SettingsNotice } from "./settings-notice";

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

  const errorFor = (field: string) => (fieldError?.field === field ? fieldError.text : undefined);

  return (
    <form onSubmit={onSubmit} className="space-y-[14px]">
      {notice && <SettingsNotice kind={notice.kind}>{notice.text}</SettingsNotice>}
      <div className="grid grid-cols-2 gap-[10px]">
        <SpField label="First name" htmlFor="first-name" optional error={errorFor("firstName")} className="min-w-0">
          <SpInput
            id="first-name"
            surface="panel"
            autoComplete="given-name"
            placeholder="First name"
            maxLength={MAX}
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            aria-invalid={fieldError?.field === "firstName"}
          />
        </SpField>
        <SpField label="Last name" htmlFor="last-name" optional error={errorFor("lastName")} className="min-w-0">
          <SpInput
            id="last-name"
            surface="panel"
            autoComplete="family-name"
            placeholder="Last name"
            maxLength={MAX}
            value={last}
            onChange={(e) => setLast(e.target.value)}
            aria-invalid={fieldError?.field === "lastName"}
          />
        </SpField>
      </div>
      <SpField label="Email" htmlFor="email" hint="Your login email. It can't be changed here.">
        <SpInput id="email" surface="panel" icon={<IconLock />} value={email} readOnly />
      </SpField>
      <SpButton type="submit" className="w-full" disabled={pending || !changed}>
        {pending ? "Saving…" : "Save"}
      </SpButton>
    </form>
  );
}
