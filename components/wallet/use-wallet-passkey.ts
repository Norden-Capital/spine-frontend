"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api, errorMessage } from "@/lib/api";
import { credentialToJSON, isCancel, passkeysSupported, toRequestOptions } from "@/lib/passkeys";

/** The one text for every Face ID failure on the lock page (design faceid-3). */
export const FACE_ID_FAILED = "Face ID did not work. Use your PIN or try again.";

// Set by the lock button / the 15-minute lock: the next lock page does not
// start Face ID by itself (you just locked it; nobody may be looking).
let skipAutoStart = false;

/** Call before locking the wallet on purpose: no automatic Face ID on the lock page that follows. */
export function noAutoFaceIdNextTime() {
  skipAutoStart = true;
}

export type WalletPasskeyResult = "ok" | "cancel" | { error: string };

/**
 * Face ID (passkey) unlock for the wallet lock page.
 *
 * - `enabled` = the person has a passkey (wallet status `passkey`).
 * - The request options are loaded when the page opens, so a tap starts
 *   Face ID at once (iPhone Safari only allows it straight from a tap).
 * - It also tries once by itself on page open; a browser that refuses it
 *   without a tap (or a closed Face ID) stays quiet.
 * - A success unlocks the wallet like a correct PIN (the caller refreshes).
 */
export function useWalletPasskey({
  enabled,
  onSuccess,
  onError,
}: {
  enabled: boolean;
  onSuccess: () => void;
  onError: (text: string) => void;
}) {
  // "checking" until we know the browser can do passkeys.
  const [support, setSupport] = useState<"checking" | "yes" | "no">("checking");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const options = useRef<PublicKeyCredentialRequestOptions | null>(null);
  const running = useRef<AbortController | null>(null);
  const inflight = useRef<Promise<unknown> | null>(null);
  const alive = useRef(true);
  const callbacks = useRef({ onSuccess, onError });
  useEffect(() => {
    callbacks.current = { onSuccess, onError };
  });

  /** Fresh options (a challenge works once). */
  const prepare = useCallback(async (): Promise<boolean> => {
    setReady(false);
    options.current = null;
    try {
      const request = api<Record<string, unknown>>("/wallet/unlock/passkey/options", { method: "POST" });
      inflight.current = request;
      const json = await request.finally(() => {
        if (inflight.current === request) inflight.current = null;
      });
      if (!alive.current) return false;
      options.current = toRequestOptions(json);
      setReady(true);
      return true;
    } catch {
      // No Face ID this time; the PIN still works.
      return false;
    }
  }, []);

  /** Ask the browser for Face ID, then the server. */
  const run = useCallback(async (): Promise<WalletPasskeyResult> => {
    if (!options.current) return "cancel";
    running.current?.abort();
    const controller = new AbortController();
    running.current = controller;
    setPending(true);
    let credential: PublicKeyCredential | null;
    try {
      credential = (await navigator.credentials.get({
        publicKey: options.current,
        signal: controller.signal,
      })) as PublicKeyCredential | null;
      if (!credential) throw new DOMException("No credential", "NotAllowedError");
    } catch (err) {
      if (running.current === controller) {
        running.current = null;
        setPending(false);
      }
      // Closed Face ID, refused without a tap, or stopped by a new tap: say nothing.
      // The challenge was not used, so the same options still work for the next tap.
      return isCancel(err) ? "cancel" : { error: FACE_ID_FAILED };
    }
    running.current = null;
    try {
      await api("/wallet/unlock/passkey", { method: "POST", body: { credential: credentialToJSON(credential) } });
      return "ok";
    } catch (err) {
      setPending(false);
      // The challenge is used now: get a new one for the next try.
      void prepare();
      const known = err instanceof ApiError && err.code !== "passkey_failed" && err.status !== 401 && err.status !== 400;
      return { error: known ? errorMessage(err) : FACE_ID_FAILED };
    }
  }, [prepare]);

  const handle = useCallback((result: WalletPasskeyResult) => {
    if (!alive.current) return;
    if (result === "ok") callbacks.current.onSuccess();
    else if (result !== "cancel") callbacks.current.onError(result.error);
  }, []);

  useEffect(() => {
    alive.current = true;
    const auto = !skipAutoStart;
    skipAutoStart = false;
    void (async () => {
      const ok = await passkeysSupported();
      if (!alive.current) return;
      setSupport(ok ? "yes" : "no");
      if (!enabled || !ok || !(await prepare()) || !auto || !alive.current) return;
      // Once by itself. A browser that wants a tap first refuses it: quiet.
      handle(await run());
    })();
    return () => {
      alive.current = false;
      running.current?.abort();
    };
  }, [enabled, prepare, run, handle]);

  /** The Face ID buttons. Must run straight from the tap. */
  const start = useCallback(async () => {
    handle(await run());
  }, [run, handle]);

  /** Wait until no options request is running (call before the PIN unlock). */
  const waitIdle = useCallback(async () => {
    try {
      await inflight.current;
    } catch {
      // Failed options: nothing to wait for.
    }
  }, []);

  return {
    /** Show the Face ID parts ("checking" counts as yes: no flash on phones that have it). */
    available: enabled && support !== "no",
    /** The browser can do passkeys at all (for the "add Face ID" tip). */
    supported: support === "yes",
    ready,
    pending,
    start,
    waitIdle,
  };
}
