"use client";

import { useState } from "react";
import { IconKey } from "@/components/spine-ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { BottomSheet, IconTile, SpButton, SpField, SpPasswordInput } from "@/components/spine-ui";
import { SettingsNotice } from "./settings-notice";

const MIN_LENGTH = 12;
const FORM_ID = "change-password-form";

/**
 * "Password" card with a "Change password" button that opens a bottom
 * sheet (3 fields). This session stays; the backend logs out other devices.
 */
export function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tooShort = next.length < MIN_LENGTH;
  const mismatch = repeat !== next;
  const missingCurrent = current.length === 0;

  function reset() {
    setCurrent("");
    setNext("");
    setRepeat("");
    setTouched(false);
    setCurrentError(null);
    setSheetError(null);
  }

  function onOpenChange(nextOpen: boolean) {
    if (pending) return;
    setOpen(nextOpen);
    // Typed passwords do not stay in memory after the sheet closes.
    if (!nextOpen) reset();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setSheetError(null);
    setCurrentError(null);
    if (missingCurrent || tooShort || mismatch) return;
    setPending(true);
    try {
      await api("/me/password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      reset();
      setOpen(false);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_current_password") {
        setCurrentError(err.message);
      } else if (err instanceof ApiError && err.code === "weak_password") {
        setSheetError(`This password is too weak. Use at least ${MIN_LENGTH} characters.`);
      } else {
        setSheetError(errorMessage(err));
      }
    } finally {
      setPending(false);
    }
  }

  const currentMsg = currentError ?? (touched && missingCurrent ? "Enter your current password." : undefined);

  return (
    <section className="rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[16px] pb-[16px]">
      <div className="flex items-start gap-[12px]">
        <IconTile tone="violet" size={52}>
          <IconKey />
        </IconTile>
        <div className="min-w-0 flex-1 pt-[4px] leading-snug">
          <h2 className="text-[0.9375rem] font-medium text-(--sp-text)">Password</h2>
          <p className="mt-[5px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            At least {MIN_LENGTH} characters. When you change it, your other devices are logged out.
          </p>
        </div>
      </div>
      {done && (
        <div className="mt-[14px]">
          <SettingsNotice kind="ok">Password changed. Other devices are logged out.</SettingsNotice>
        </div>
      )}
      <SpButton
        className="mt-[16px] w-full"
        variant="secondary"
        icon={<IconKey aria-hidden />}
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
      >
        Change password
      </SpButton>

      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Change password"
        description="You stay logged in here. Your other devices are logged out."
        footer={
          <SpButton type="submit" form={FORM_ID} className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Change password"}
          </SpButton>
        }
      >
        <form id={FORM_ID} onSubmit={onSubmit} className="space-y-[14px] pt-[4px]" noValidate>
          {sheetError && <SettingsNotice kind="error">{sheetError}</SettingsNotice>}
          <SpField label="Current password" htmlFor="current-password" error={currentMsg}>
            <SpPasswordInput
              id="current-password"
              surface="panel"
              autoComplete="current-password"
              placeholder="Your current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              aria-invalid={Boolean(currentMsg)}
            />
          </SpField>
          <SpField
            label="New password"
            htmlFor="new-password"
            hint={`At least ${MIN_LENGTH} characters.`}
            error={touched && tooShort ? `Use at least ${MIN_LENGTH} characters.` : undefined}
          >
            <SpPasswordInput
              id="new-password"
              surface="panel"
              autoComplete="new-password"
              placeholder={`At least ${MIN_LENGTH} characters`}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              aria-invalid={touched && tooShort}
            />
          </SpField>
          <SpField
            label="Repeat new password"
            htmlFor="repeat-password"
            error={touched && mismatch ? "The passwords are not the same." : undefined}
          >
            <SpPasswordInput
              id="repeat-password"
              surface="panel"
              autoComplete="new-password"
              placeholder="Repeat the password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              aria-invalid={touched && mismatch}
            />
          </SpField>
        </form>
      </BottomSheet>
    </section>
  );
}
