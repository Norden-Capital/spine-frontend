"use client";

// Wallet unlock with Face ID — DESIGN MOCKS ONLY (dev).
// Only when the person has Face ID (a passkey) in Settings › Security on this phone.
// iPhone Safari starts Face ID only from a tap, so the page shows one big button.

import type { ReactNode } from "react";
import { IconFaceId, IconLock, SpButton } from "@/components/spine-ui";
import { PinPad } from "@/components/wallet/pin-pad";

function Screen({ title, subtitle, error, children }: { title: string; subtitle: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-[24px] pt-[40px] text-center">
      <span className="flex size-[64px] items-center justify-center rounded-full bg-(--sp-card-back) text-(--sp-card-back-text) [&_svg]:size-[26px]">
        <IconLock aria-hidden />
      </span>
      <div>
        <h1 className="text-[1.375rem] leading-snug font-medium text-(--sp-text)">{title}</h1>
        <p className="mx-auto mt-[4px] max-w-[300px] text-[0.8125rem] leading-snug text-(--sp-text-muted)">{subtitle}</p>
      </div>
      <p className="min-h-[1.25rem] text-[0.8125rem] leading-snug text-(--sp-danger)">{error}</p>
      {children}
    </div>
  );
}

function LinkButton({ children }: { children: ReactNode }) {
  return (
    <button type="button" className="min-h-[44px] rounded-full px-[16px] py-[8px] text-[0.9375rem] leading-snug font-medium text-(--sp-text)">
      {children}
    </button>
  );
}

function FaceIdButton() {
  return (
    <SpButton className="w-full max-w-[320px]" icon={<IconFaceId aria-hidden />}>
      Unlock with Face ID
    </SpButton>
  );
}

/** 1. Face ID is set up: one tap to unlock. The PIN is one tap away. */
function FaceIdReady() {
  return (
    <Screen title="Your wallet is locked" subtitle="Unlock it with Face ID.">
      <FaceIdButton />
      <LinkButton>Use my PIN instead</LinkButton>
    </Screen>
  );
}

/** 2. After the tap: the iPhone's own Face ID window. */
function FaceIdScanning() {
  return (
    <div className="relative">
      <FaceIdReady />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="flex size-[160px] flex-col items-center justify-center gap-[14px] rounded-[28px] bg-[rgb(40_40_40/0.92)] text-white [&_svg]:size-[56px]">
          <IconFaceId aria-hidden />
          <span className="text-[0.9375rem] font-medium">Face ID</span>
        </div>
      </div>
    </div>
  );
}

/** 3. PIN instead (chosen, or Face ID did not work): the pad, and a way back to Face ID. */
function PinWithFaceId() {
  return (
    <Screen title="Enter your wallet PIN" subtitle="Your personal wallet is locked." error="Face ID did not work. Use your PIN or try again.">
      <PinPad onComplete={() => {}} />
      <div className="flex flex-col items-center gap-[4px]">
        <SpButton variant="secondary" icon={<IconFaceId aria-hidden />}>
          Use Face ID
        </SpButton>
        <LinkButton>Forgot PIN?</LinkButton>
      </div>
    </Screen>
  );
}

/** 4. No Face ID on this phone: the PIN page as today, plus a small tip. */
function NoFaceId() {
  return (
    <Screen title="Enter your wallet PIN" subtitle="Your personal wallet is locked.">
      <PinPad onComplete={() => {}} />
      <LinkButton>Forgot PIN?</LinkButton>
      <p className="max-w-[300px] text-[0.75rem] leading-snug text-(--sp-text-muted)">
        Tip: add Face ID in Settings › Security to open your wallet with one tap.
      </p>
    </Screen>
  );
}

export const FACEID_MOCKS: Record<string, () => ReactNode> = {
  "faceid-1-ready": () => <FaceIdReady />,
  "faceid-2-scanning": () => <FaceIdScanning />,
  "faceid-3-pin": () => <PinWithFaceId />,
  "faceid-4-no-faceid": () => <NoFaceId />,
};
