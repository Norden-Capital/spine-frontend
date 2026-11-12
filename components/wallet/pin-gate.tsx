"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconCheckGlyph, IconEyeOff, IconGoal, IconKey, IconLock, IconWallet } from "@/components/spine-ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useDates } from "@/components/prefs/prefs-provider";
import { BottomSheet, SpButton, SpField, SpInput, SpPasswordInput } from "@/components/spine-ui";
import { PinPad, PIN_LENGTH } from "./pin-pad";

type SetupStep = "welcome" | "pin" | "ready";

/**
 * First visit (no PIN yet): a welcome screen, then the PIN in 2 steps
 * (choose, type again), then "Your wallet is ready" and the dashboard.
 */
export function PinSetup() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("welcome");
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reset, setReset] = useState(0);

  async function done(pin: string) {
    if (first === null) {
      setFirst(pin);
      setError(null);
      setReset((r) => r + 1);
      return;
    }
    if (pin !== first) {
      setFirst(null);
      setError("PINs don't match, try again.");
      setReset((r) => r + 1);
      return;
    }
    setPending(true);
    try {
      await api("/wallet/pin", { method: "POST", body: { pin } });
      setStep("ready");
      // A short moment to see it worked, then the dashboard.
      setTimeout(() => router.refresh(), 1400);
    } catch (err) {
      setPending(false);
      setFirst(null);
      setError(errorMessage(err));
      setReset((r) => r + 1);
    }
  }

  if (step === "welcome") return <WalletWelcome onStart={() => setStep("pin")} />;
  if (step === "ready") {
    return (
      <div role="status" className="flex min-h-[60svh] flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-(--sp-card-back) text-(--sp-card-back-text)">
          <IconCheckGlyph className="size-7" aria-hidden />
        </span>
        <h1 className="text-[1.375rem] font-medium text-(--sp-text)">Your wallet is ready</h1>
        <p className="text-[0.875rem] text-(--sp-text-muted)">Opening it now…</p>
      </div>
    );
  }
  return (
    <Screen
      step={first === null ? "Step 1 of 2" : "Step 2 of 2"}
      title={first === null ? "Choose a 6-digit PIN" : "Type it again"}
      subtitle={first === null ? "You type it each time you open your wallet." : "The same 6 digits, to be sure."}
      error={error}
    >
      <PinPad onComplete={done} disabled={pending} reset={reset} error={Boolean(error) && first === null} />
    </Screen>
  );
}

const WELCOME_POINTS = [
  { icon: <IconEyeOff aria-hidden />, text: "Only you can see it — not even the Owner." },
  { icon: <IconGoal aria-hidden />, text: "Track your own spending, budgets, goals and repeat payments." },
  { icon: <IconKey aria-hidden />, text: "Protected by a 6-digit PIN you choose." },
];

/** Space between the top bar and the dock (same sum as the full-page states). */
const WELCOME_HEIGHT =
  "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 12px - 44px - 17.5px - var(--sp-dock-h) - var(--sp-dock-gap) - 16px)";

/**
 * (Short phones, under 720px tall: a bit tighter so nothing scrolls.)
 * First-time welcome, in the wallet's yellow card look. Fills the screen
 * between the top bar and the dock: the hero and the points grow on big
 * phones, and "Set up my PIN" sits at the bottom (thumb zone).
 */
function WalletWelcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col gap-4 [@media(max-height:720px)]:gap-3" style={{ minHeight: WELCOME_HEIGHT }}>
      <div className="flex max-h-[300px] min-h-[200px] flex-[3_1_auto] flex-col justify-between overflow-hidden rounded-(--sp-radius) bg-(--sp-card-back) px-5 pt-5 pb-6 [@media(max-height:720px)]:min-h-0 [@media(max-height:720px)]:pb-5 text-(--sp-card-back-text)">
        <span className="flex size-14 items-center justify-center rounded-full bg-black/10 [@media(max-height:720px)]:size-12">
          <IconWallet className="size-7" aria-hidden />
        </span>
        <div className="mt-6 [@media(max-height:720px)]:mt-4">
          <h1 className="text-[1.75rem] leading-tight font-medium [@media(max-height:720px)]:text-[1.5rem]">Welcome to your wallet</h1>
          <p className="mt-2 text-[0.9375rem] opacity-80">Your own private space for your personal money.</p>
        </div>
      </div>
      <ul className="flex max-h-[340px] flex-[2_1_auto] flex-col justify-evenly gap-1 rounded-(--sp-radius) bg-(--sp-panel) p-2">
        {WELCOME_POINTS.map((p) => (
          <li key={p.text} className="flex items-center gap-3 px-2 py-2.5 [@media(max-height:720px)]:py-1.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) [&_svg]:size-[19px]">
              {p.icon}
            </span>
            <span className="text-[0.9375rem] leading-snug text-(--sp-text)">{p.text}</span>
          </li>
        ))}
      </ul>
      <SpButton onClick={onStart} className="mt-auto w-full shrink-0">
        Set up my PIN
      </SpButton>
    </div>
  );
}

/** Wallet locked: enter the PIN. "Forgot PIN?" resets it with the account password. */
export function PinUnlock({ lockedUntil }: { lockedUntil: string | null }) {
  const router = useRouter();
  const dates = useDates();
  const [error, setError] = useState<string | null>(null);
  const [until, setUntil] = useState<string | null>(lockedUntil);
  const [pending, setPending] = useState(false);
  const [reset, setReset] = useState(0);
  const [forgot, setForgot] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // While blocked after 5 wrong PINs, tick so the pad opens again by itself.
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, [until]);
  const blocked = Boolean(until && new Date(until).getTime() > now);

  async function done(pin: string) {
    setPending(true);
    setError(null);
    try {
      await api("/wallet/unlock", { method: "POST", body: { pin } });
      router.refresh();
    } catch (err) {
      setPending(false);
      setReset((r) => r + 1);
      if (err instanceof ApiError && err.code === "too_many_attempts") {
        const status = await api<{ lockedUntil: string | null }>("/wallet/status").catch(() => null);
        setUntil(status?.lockedUntil ?? new Date(Date.now() + 5 * 60_000).toISOString());
        setError("Too many wrong PINs. Wait 5 minutes, or reset your PIN.");
      } else {
        setError(errorMessage(err));
      }
    }
  }

  return (
    <Screen
      title="Enter your wallet PIN"
      subtitle="Your personal wallet is locked."
      error={blocked ? `Too many wrong PINs. Try again after ${dates.dateTime(until)}.` : error}
    >
      <PinPad onComplete={done} disabled={pending || blocked} reset={reset} error={Boolean(error) && !blocked} />
      <button
        type="button"
        onClick={() => setForgot(true)}
        className="h-11 rounded-full px-4 text-[0.9375rem] font-medium text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97]"
      >
        Forgot PIN?
      </button>
      <ForgotPin open={forgot} onOpenChange={setForgot} />
    </Screen>
  );
}

function Screen({
  step,
  title,
  subtitle,
  error,
  children,
}: {
  step?: string;
  title: string;
  subtitle: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-6 pt-2 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-(--sp-card-back) text-(--sp-card-back-text)">
        <IconLock className="size-6" aria-hidden />
      </span>
      <div>
        {step && <p className="mb-1 text-[0.75rem] font-medium tracking-wide text-(--sp-text-muted) uppercase">{step}</p>}
        <h1 className="text-[22px] font-medium text-(--sp-text)">{title}</h1>
        <p className="mx-auto mt-1 max-w-[300px] text-sm text-(--sp-text-muted)">{subtitle}</p>
      </div>
      <p role="alert" className="min-h-5 text-[0.875rem] text-(--sp-danger)">
        {error}
      </p>
      {children}
    </div>
  );
}

/** Reset the PIN with the account password. */
function ForgotPin({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);

  const pinOk = new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
  const same = pin === pin2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!password || !pinOk || !same) return;
    setPending(true);
    try {
      await api("/wallet/pin/reset", { method: "POST", body: { password, newPin: pin } });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setPending(false);
      setError(errorMessage(err));
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title="Reset your PIN"
      description="Enter your account password, then a new 6-digit PIN."
      footer={
        <SpButton type="submit" form="reset-pin-form" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Reset PIN"}
        </SpButton>
      }
    >
      <form id="reset-pin-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && (
          <p role="alert" className="rounded-2xl bg-[color-mix(in_oklab,var(--sp-danger)_12%,transparent)] px-4 py-3 text-[0.875rem] text-(--sp-danger)">
            {error}
          </p>
        )}
        <SpField label="Account password" htmlFor="reset-password" error={touched && !password ? "Enter your password." : undefined}>
          <SpPasswordInput
            id="reset-password"
            surface="panel"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </SpField>
        <SpField label="New PIN" htmlFor="reset-pin" error={touched && !pinOk ? "Use exactly 6 digits." : undefined}>
          <SpInput
            id="reset-pin"
            surface="panel"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            placeholder="6 digits"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="tracking-[0.4em]"
          />
        </SpField>
        <SpField label="Repeat the new PIN" htmlFor="reset-pin2" error={touched && !same ? "The PINs are not the same." : undefined}>
          <SpInput
            id="reset-pin2"
            surface="panel"
            inputMode="numeric"
            autoComplete="off"
            maxLength={PIN_LENGTH}
            placeholder="6 digits"
            value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
            className="tracking-[0.4em]"
          />
        </SpField>
      </form>
    </BottomSheet>
  );
}

/**
 * Inside an unlocked wallet: lock after 15 minutes without any tap or key,
 * and go back to the PIN pad when any wallet call answers 423.
 */
export function WalletSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const lock = () => {
      void api("/wallet/lock", { method: "POST" })
        .catch(() => {})
        .finally(() => router.refresh());
    };
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(lock, 15 * 60_000);
    };
    const onLocked = () => router.refresh();
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, restart, { passive: true }));
    window.addEventListener("spine:wallet-locked", onLocked);
    restart();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, restart));
      window.removeEventListener("spine:wallet-locked", onLocked);
    };
  }, [router]);

  // Next keeps earlier pages (hidden) for the back button. Once you leave the
  // wallet it is locked, so drop its content too: no wallet data stays in
  // the page. Coming back asks the server again (PIN screen).
  const inWallet = pathname === "/wallet" || pathname.startsWith("/wallet/");
  return inWallet ? <>{children}</> : null;
}
