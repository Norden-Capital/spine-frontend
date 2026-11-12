"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import {
  credentialToJSON,
  defaultPasskeyName,
  isCancel,
  passkeyErrorText,
  passkeysSupported,
  toCreationOptions,
} from "@/lib/passkeys";
import { useDates } from "@/components/prefs/prefs-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type Passkey = { id: string; name: string; createdAt: string; lastUsedAt: string | null };
type Notice = { kind: "ok" | "error"; text: string };

const MAX_NAME = 60;
const ITEM = "min-h-11 gap-3 px-3 text-base";

/**
 * "Face ID & fingerprint": the user's passkeys. Hidden when the browser
 * can't use passkeys. The list comes from the server (null = load failed).
 */
export function PasskeysSection({ passkeys }: { passkeys: Passkey[] | null }) {
  const router = useRouter();
  const dates = useDates();
  // null = still checking; the section shows only once we know.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [rename, setRename] = useState<Passkey | null>(null);
  const [remove, setRemove] = useState<Passkey | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void passkeysSupported().then((ok) => alive && setSupported(ok));
    return () => {
      alive = false;
    };
  }, []);

  if (!supported) return null;

  function done(text: string) {
    setNotice({ kind: "ok", text });
    router.refresh();
  }

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    try {
      await api(`/me/passkeys/${encodeURIComponent(remove.id)}`, { method: "DELETE" });
      done(`"${remove.name}" is removed. It can't be used to log in anymore.`);
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
      router.refresh();
    } finally {
      setBusy(false);
      setRemoveOpen(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face ID &amp; fingerprint</CardTitle>
        <CardDescription>Log in without your password on this device.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {notice && (
          <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
            <AlertDescription>{notice.text}</AlertDescription>
          </Alert>
        )}

        {passkeys === null ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            Your passkeys could not be loaded. Please try again later.
          </p>
        ) : passkeys.length > 0 ? (
          <ul className="flex flex-col divide-y overflow-hidden rounded-xl border">
            {passkeys.map((p) => (
              <li key={p.id} className="flex min-h-14 items-center gap-3 py-2 pr-1 pl-4">
                <Fingerprint className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Added {dates.date(p.createdAt)} · Last used {p.lastUsedAt ? dates.dateTime(p.lastUsedAt) : "never"}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="size-11 shrink-0" />}
                    aria-label={`Actions for ${p.name}`}
                  >
                    <MoreHorizontal className="size-5" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
                    <DropdownMenuItem className={ITEM} onClick={() => setRename(p)}>
                      <Pencil aria-hidden />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={ITEM}
                      variant="destructive"
                      onClick={() => {
                        setRemove(p);
                        setRemoveOpen(true);
                      }}
                    >
                      <Trash2 aria-hidden />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No Face ID / fingerprint yet.</p>
        )}

        <Button size="lg" variant="outline" className="h-11 w-full" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden />
          Add Face ID / fingerprint
        </Button>
      </CardContent>

      <AddPasskeyDialog open={addOpen} onOpenChange={setAddOpen} onAdded={(name) => done(`"${name}" is added.`)} />
      <RenameDialog
        passkey={rename}
        onClose={() => setRename(null)}
        onRenamed={(name) => done(`Renamed to "${name}".`)}
      />

      <AlertDialog open={removeOpen} onOpenChange={(next) => !next && !busy && setRemoveOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">Remove &quot;{remove?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              You can&apos;t log in with it anymore. You can still use your password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-11" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" size="lg" className="h-11" onClick={confirmRemove} disabled={busy}>
              {busy ? "Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/**
 * Name, then Face ID. The options are loaded when the dialog opens, so the
 * tap on "Continue" starts Face ID right away (iPhone Safari only allows it
 * straight from a tap).
 */
function AddPasskeyDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (name: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Face ID / fingerprint</DialogTitle>
          <DialogDescription>Give it a name, then confirm with your face or finger.</DialogDescription>
        </DialogHeader>
        {open && (
          <AddPasskeyForm
            onDone={(name) => {
              onOpenChange(false);
              onAdded(name);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddPasskeyForm({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState(defaultPasskeyName);
  const [options, setOptions] = useState<PublicKeyCredentialCreationOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadOptions() {
    setOptions(null);
    try {
      const json = await api<Record<string, unknown>>("/me/passkeys/register/options", { method: "POST" });
      setOptions(toCreationOptions(json));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => {
    // Loading the options from the backend when the form opens is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOptions();
  }, []);

  const trimmed = name.trim();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!options || !trimmed) return;
    setError(null);
    setPending(true);
    try {
      const credential = (await navigator.credentials.create({ publicKey: options })) as PublicKeyCredential | null;
      if (!credential) throw new DOMException("No credential", "NotAllowedError");
      await api("/me/passkeys/register", {
        method: "POST",
        body: { name: trimmed, credential: credentialToJSON(credential) },
      });
      onDone(trimmed);
    } catch (err) {
      setPending(false);
      // Closed Face ID: no error, just try again. A used challenge needs new options.
      if (!isCancel(err)) {
        setError(err instanceof ApiError ? errorMessage(err) : passkeyErrorText(err));
      }
      void loadOptions();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Field data-invalid={!trimmed}>
        <FieldLabel htmlFor="passkey-name">Name</FieldLabel>
        <Input
          id="passkey-name"
          maxLength={MAX_NAME}
          autoComplete="off"
          placeholder="e.g. iPhone"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!trimmed}
          className="h-11"
        />
        {!trimmed && <FieldError>Enter a name.</FieldError>}
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending || !options || !trimmed}>
        <Fingerprint aria-hidden />
        {pending ? "Waiting for Face ID…" : options ? "Continue" : "Getting ready…"}
      </Button>
    </form>
  );
}

function RenameDialog({
  passkey,
  onClose,
  onRenamed,
}: {
  passkey: Passkey | null;
  onClose: () => void;
  onRenamed: (name: string) => void;
}) {
  return (
    <Dialog open={passkey !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        {passkey && (
          <RenameForm
            key={passkey.id}
            passkey={passkey}
            onDone={(name) => {
              onClose();
              onRenamed(name);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({ passkey, onDone }: { passkey: Passkey; onDone: (name: string) => void }) {
  const [name, setName] = useState(passkey.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const trimmed = name.trim();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    try {
      await api(`/me/passkeys/${encodeURIComponent(passkey.id)}`, { method: "PATCH", body: { name: trimmed } });
      onDone(trimmed);
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field data-invalid={Boolean(error) || !trimmed}>
        <FieldLabel htmlFor="passkey-rename">Name</FieldLabel>
        <Input
          id="passkey-rename"
          maxLength={MAX_NAME}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(error) || !trimmed}
          className="h-11"
        />
        {error ? <FieldError>{error}</FieldError> : !trimmed && <FieldError>Enter a name.</FieldError>}
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending || !trimmed}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
