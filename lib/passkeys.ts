// Browser-only helpers for passkeys (WebAuthn): Face ID, Touch ID,
// fingerprint, Windows Hello.
//
// The backend speaks the standard WebAuthn JSON (binary = base64url). We use
// the browser's own JSON helpers when present (PublicKeyCredential.
// parseCreationOptionsFromJSON / toJSON) and a small fallback otherwise.

type Json = Record<string, unknown>;

// ---- base64url <-> bytes ----------------------------------------------------

function fromB64url(value: string): ArrayBuffer {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function toB64url(buffer: ArrayBuffer | null | undefined): string | undefined {
  if (!buffer) return undefined;
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Some servers wrap the options in { publicKey: {...} }. */
function unwrap(json: Json): Json {
  return (json.publicKey as Json | undefined) ?? json;
}

type CredentialStatic = typeof PublicKeyCredential & {
  parseCreationOptionsFromJSON?: (json: Json) => PublicKeyCredentialCreationOptions;
  parseRequestOptionsFromJSON?: (json: Json) => PublicKeyCredentialRequestOptions;
  getClientCapabilities?: () => Promise<Record<string, boolean>>;
};

function PKC(): CredentialStatic | undefined {
  return typeof window !== "undefined" && "PublicKeyCredential" in window
    ? (window.PublicKeyCredential as CredentialStatic)
    : undefined;
}

function decodeDescriptors(list: unknown): PublicKeyCredentialDescriptor[] | undefined {
  if (!Array.isArray(list)) return undefined;
  return list.map((d: Json) => ({ ...d, id: fromB64url(d.id as string) }) as PublicKeyCredentialDescriptor);
}

/** JSON from POST /api/me/passkeys/register/options -> options for create(). */
export function toCreationOptions(json: Json): PublicKeyCredentialCreationOptions {
  const o = unwrap(json);
  const native = PKC()?.parseCreationOptionsFromJSON;
  if (native) return native.call(PKC(), o);
  const user = o.user as Json;
  return {
    ...(o as object),
    challenge: fromB64url(o.challenge as string),
    user: { ...(user as object), id: fromB64url(user.id as string) },
    excludeCredentials: decodeDescriptors(o.excludeCredentials),
  } as PublicKeyCredentialCreationOptions;
}

/** JSON from POST /api/auth/passkey/options -> options for get(). */
export function toRequestOptions(json: Json): PublicKeyCredentialRequestOptions {
  const o = unwrap(json);
  const native = PKC()?.parseRequestOptionsFromJSON;
  if (native) return native.call(PKC(), o);
  return {
    ...(o as object),
    challenge: fromB64url(o.challenge as string),
    allowCredentials: decodeDescriptors(o.allowCredentials),
  } as PublicKeyCredentialRequestOptions;
}

/** A created / used credential -> the JSON the backend expects. */
export function credentialToJSON(credential: PublicKeyCredential): Json {
  const withJson = credential as PublicKeyCredential & { toJSON?: () => Json };
  if (typeof withJson.toJSON === "function") return withJson.toJSON();
  const r = credential.response as AuthenticatorResponse & {
    attestationObject?: ArrayBuffer;
    authenticatorData?: ArrayBuffer;
    signature?: ArrayBuffer;
    userHandle?: ArrayBuffer | null;
    getTransports?: () => string[];
  };
  const response: Json = { clientDataJSON: toB64url(r.clientDataJSON) };
  if (r.attestationObject) {
    response.attestationObject = toB64url(r.attestationObject);
    response.transports = r.getTransports?.() ?? [];
  } else {
    response.authenticatorData = toB64url(r.authenticatorData);
    response.signature = toB64url(r.signature);
    response.userHandle = toB64url(r.userHandle);
  }
  return {
    id: credential.id,
    rawId: toB64url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment ?? undefined,
    response,
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

// ---- what the device can do -------------------------------------------------

/**
 * Can this browser use passkeys at all (this device, or a phone nearby)?
 * Used to hide the passkey parts of the UI when it can't.
 */
export async function passkeysSupported(): Promise<boolean> {
  const pkc = PKC();
  if (!pkc || !window.isSecureContext) return false;
  try {
    if (pkc.getClientCapabilities) {
      const caps = await pkc.getClientCapabilities();
      if (caps.passkeyPlatformAuthenticator || caps.hybridTransport) return true;
    }
    return await pkc.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Can the browser offer passkeys inside the email field (autofill)? */
export async function autofillSupported(): Promise<boolean> {
  const pkc = PKC() as (CredentialStatic & { isConditionalMediationAvailable?: () => Promise<boolean> }) | undefined;
  try {
    return Boolean(await pkc?.isConditionalMediationAvailable?.());
  } catch {
    return false;
  }
}

/** The user closed Face ID / the passkey sheet, or we stopped it: not an error to show. */
export function isCancel(err: unknown): boolean {
  return err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "AbortError");
}

/** Message for a WebAuthn browser error that is not a cancel. */
export function passkeyErrorText(err: unknown): string {
  if (err instanceof DOMException && err.name === "InvalidStateError") {
    return "This device already has a passkey for your account.";
  }
  if (err instanceof DOMException && err.name === "SecurityError") {
    return "Passkeys don't work on this address. Open Spine from its usual link.";
  }
  return "Face ID / fingerprint did not work. Please try again.";
}

/** A friendly default name for a new passkey, from the device type. */
export function defaultPasskeyName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iPad";
  if (/Android/.test(ua)) return "Android phone";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/CrOS/.test(ua)) return "Chromebook";
  return "This device";
}
