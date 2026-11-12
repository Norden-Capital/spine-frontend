"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconDelete, IconEdit, IconFaceId, IconLaptop, IconMore, IconPhone } from "@/components/spine-ui";
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
import {
  BottomSheet,
  DeviceCard,
  IconButton,
  IconTile,
  SpButton,
  SpField,
  SpInput,
  type IconTileTone,
} from "@/components/spine-ui";
import { ActionMenu, ActionMenuItem } from "@/components/nav/action-menu";
import { SettingsNotice } from "./settings-notice";

export type Passkey = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  /** True only for the passkey used to log in this session. */
  current?: boolean;
};
type Notice = { kind: "ok" | "error"; text: string };

const MAX_NAME = 60;

/** Card colors, in turn (look only). */
const TONES: IconTileTone[] = ["violet", "sun", "ink"];

/** Icon by the name the user gave (look only). */
function deviceIcon(name: string) {
  if (/iphone|android|phone|pixel|galaxy/i.test(name)) return <IconPhone aria-hidden />;
  if (/mac|laptop|windows|\bpc\b|chromebook/i.test(name)) return <IconLaptop aria-hidden />;
  return <IconFaceId aria-hidden />;
}

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
    <>
      <section className="rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[16px] pb-[16px]">
        <div className="flex items-start gap-[12px]">
          <IconTile tone="ink" size={52}>
            <IconFaceId />
          </IconTile>
          <div className="min-w-0 flex-1 pt-[4px] leading-snug">
            <h2 className="text-[0.9375rem] font-medium text-(--sp-text)">Face ID &amp; fingerprint</h2>
            <p className="mt-[5px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
              Log in without your password on these devices.
            </p>
          </div>
        </div>
        {notice && (
          <div className="mt-[14px]">
            <SettingsNotice kind={notice.kind}>{notice.text}</SettingsNotice>
          </div>
        )}

        {passkeys === null ? (
          <p className="mt-[16px] rounded-[16px] bg-(--sp-soft) px-[14px] py-[16px] text-center text-[0.8125rem] leading-snug text-(--sp-text-muted)">
            Your passkeys could not be loaded. Please try again later.
          </p>
        ) : passkeys.length > 0 ? (
          <ul className="mt-[16px] space-y-[10px]">
            {passkeys.map((p, i) => (
              <li key={p.id}>
                <DeviceCard
                  icon={deviceIcon(p.name)}
                  tone={TONES[i % TONES.length]}
                  name={p.name}
                  added={dates.date(p.createdAt)}
                  lastUsed={p.lastUsedAt ? dates.dateTime(p.lastUsedAt) : "Never"}
                  current={p.current === true}
                  action={
                    <ActionMenu
                      trigger={<IconButton label={`Actions for ${p.name}`} icon={<IconMore />} variant="ghost" />}
                    >
                      <ActionMenuItem icon={<IconEdit aria-hidden />} onClick={() => setRename(p)}>
                        Rename
                      </ActionMenuItem>
                      <ActionMenuItem
                        danger
                        icon={<IconDelete aria-hidden />}
                        onClick={() => {
                          setRemove(p);
                          setRemoveOpen(true);
                        }}
                      >
                        Remove
                      </ActionMenuItem>
                    </ActionMenu>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-[16px] rounded-[16px] bg-(--sp-soft) px-[14px] py-[16px] text-center text-[0.8125rem] text-(--sp-text-muted)">
            No Face ID / fingerprint yet.
          </p>
        )}

        <SpButton className="mt-[14px] w-full" icon={<IconFaceId aria-hidden />} onClick={() => setAddOpen(true)}>
          Add Face ID / fingerprint
        </SpButton>
        <p className="mt-[10px] text-center text-[0.625rem] leading-snug text-(--sp-text-faint)">
          Give it a name, then confirm with your face or finger.
        </p>
      </section>

      <AddPasskeyDialog open={addOpen} onOpenChange={setAddOpen} onAdded={(name) => done(`"${name}" is added.`)} />
      <RenameDialog
        passkey={rename}
        onClose={() => setRename(null)}
        onRenamed={(name) => done(`Renamed to "${name}".`)}
      />

      <BottomSheet
        open={removeOpen}
        onOpenChange={(next) => !next && !busy && setRemoveOpen(false)}
        title={`Remove "${remove?.name ?? ""}"?`}
        description="You can't log in with it anymore. You can still use your password."
        footer={
          <div className="space-y-[8px]">
            <SpButton
              className="w-full"
              variant="danger"
              icon={<IconDelete aria-hidden />}
              onClick={confirmRemove}
              disabled={busy}
            >
              {busy ? "Removing…" : "Remove"}
            </SpButton>
            <SpButton className="w-full" variant="secondary" onClick={() => setRemoveOpen(false)} disabled={busy}>
              Cancel
            </SpButton>
          </div>
        }
      >
        {null}
      </BottomSheet>
    </>
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
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add Face ID / fingerprint"
      description="Give it a name, then confirm with your face or finger."
    >
      {open && (
        <AddPasskeyForm
          onDone={(name) => {
            onOpenChange(false);
            onAdded(name);
          }}
        />
      )}
    </BottomSheet>
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
    <form onSubmit={onSubmit} className="space-y-[14px] pt-[4px]" noValidate>
      {error && <SettingsNotice kind="error">{error}</SettingsNotice>}
      <SpField label="Name" htmlFor="passkey-name" error={!trimmed ? "Enter a name." : undefined}>
        <SpInput
          id="passkey-name"
          surface="panel"
          maxLength={MAX_NAME}
          autoComplete="off"
          placeholder="e.g. iPhone"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!trimmed}
        />
      </SpField>
      <SpButton
        type="submit"
        className="w-full"
        icon={<IconFaceId aria-hidden />}
        disabled={pending || !options || !trimmed}
      >
        {pending ? "Waiting for Face ID…" : options ? "Continue" : "Getting ready…"}
      </SpButton>
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
    <BottomSheet open={passkey !== null} onOpenChange={(open) => !open && onClose()} title="Rename">
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
    </BottomSheet>
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
    <form onSubmit={onSubmit} className="space-y-[14px] pt-[4px]" noValidate>
      <SpField label="Name" htmlFor="passkey-rename" error={error ?? (!trimmed ? "Enter a name." : undefined)}>
        <SpInput
          id="passkey-rename"
          surface="panel"
          maxLength={MAX_NAME}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(error) || !trimmed}
        />
      </SpField>
      <SpButton type="submit" className="w-full" disabled={pending || !trimmed}>
        {pending ? "Saving…" : "Save"}
      </SpButton>
    </form>
  );
}
