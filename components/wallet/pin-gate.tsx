"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useDates } from "@/components/prefs/prefs-provider";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PinPad, PIN_LENGTH } from "./pin-pad";

/** First time: create a 6-digit PIN (enter, then confirm). */
export function PinSetup() {
  const router = useRouter();
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
      setError("The two PINs are not the same. Start again.");
      setReset((r) => r + 1);
      return;
    }
    setPending(true);
    try {
      await api("/wallet/pin", { method: "POST", body: { pin } });
      router.refresh();
    } catch (err) {
      setPending(false);
      setFirst(null);
      setError(errorMessage(err));
      setReset((r) => r + 1);
    }
  }

  return (
    <Screen
      title={first === null ? "Create your wallet PIN" : "Enter it again"}
      subtitle={
        first === null
          ? "Your personal wallet is private. Nobody else can see it, not even an admin."
          : "Type the same 6 digits to confirm."
      }
      error={error}
    >
      <PinPad onComplete={done} disabled={pending} reset={reset} error={Boolean(error)} />
    </Screen>
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
      <Button variant="ghost" size="lg" className="h-11" onClick={() => setForgot(true)}>
        Forgot PIN?
      </Button>
      <ForgotPin open={forgot} onOpenChange={setForgot} />
    </Screen>
  );
}

function Screen({
  title,
  subtitle,
  error,
  children,
}: {
  title: string;
  subtitle: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-6 pt-2 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-(--sp-card-back) text-(--sp-card-back-text)">
        <Lock className="size-6" aria-hidden />
      </span>
      <div>
        <h1 className="text-[22px] font-medium text-(--sp-text)">{title}</h1>
        <p className="mx-auto mt-1 max-w-[300px] text-sm text-(--sp-text-muted)">{subtitle}</p>
      </div>
      <p role="alert" className="min-h-5 text-sm text-destructive">
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
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset your PIN</DialogTitle>
          <DialogDescription>Enter your account password, then a new 6-digit PIN.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 text-left" noValidate>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Field data-invalid={touched && !password}>
            <FieldLabel htmlFor="reset-password">Account password</FieldLabel>
            <PasswordInput
              id="reset-password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field data-invalid={touched && !pinOk}>
            <FieldLabel htmlFor="reset-pin">New PIN</FieldLabel>
            <Input
              id="reset-pin"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
              placeholder="6 digits"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="h-11 tracking-[0.4em]"
            />
            {touched && !pinOk && <FieldError>Use exactly 6 digits.</FieldError>}
          </Field>
          <Field data-invalid={touched && !same}>
            <FieldLabel htmlFor="reset-pin2">Repeat the new PIN</FieldLabel>
            <Input
              id="reset-pin2"
              inputMode="numeric"
              autoComplete="off"
              maxLength={PIN_LENGTH}
              placeholder="6 digits"
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
              className="h-11 tracking-[0.4em]"
            />
            {touched && !same && <FieldError>The PINs are not the same.</FieldError>}
          </Field>
          <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
            {pending ? "Saving…" : "Reset PIN"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inside an unlocked wallet: lock after 15 minutes without any tap or key,
 * and go back to the PIN pad when any wallet call answers 423.
 */
export function WalletSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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

  return <>{children}</>;
}
