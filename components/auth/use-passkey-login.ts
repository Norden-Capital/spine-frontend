"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api, errorMessage } from "@/lib/api";
import {
  autofillSupported,
  credentialToJSON,
  isCancel,
  passkeyErrorText,
  passkeysSupported,
  toRequestOptions,
} from "@/lib/passkeys";

/**
 * Passkey login for the login page.
 *
 * - The request options are loaded when the page opens, so a tap on the
 *   button starts Face ID at once (iPhone Safari only allows it straight
 *   from a tap).
 * - If the browser can, passkeys are also offered in the email field's
 *   autofill (WebAuthn "conditional UI"). The button stops that request first.
 * - A cancel (closed Face ID) shows nothing; real errors call onError.
 */
export function usePasskeyLogin({
  onSuccess,
  onError,
}: {
  onSuccess: () => void | Promise<void>;
  onError: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const options = useRef<PublicKeyCredentialRequestOptions | null>(null);
  const autofill = useRef<AbortController | null>(null);
  const canAutofill = useRef(false);
  // prepare() calls itself after a failed autofill login (via this ref).
  const prepareRef = useRef<(withAutofill: boolean) => Promise<void>>(async () => {});
  const alive = useRef(true);
  // The options request still running, if any (see waitIdle).
  const inflight = useRef<Promise<unknown> | null>(null);
  // Keep the latest callbacks without restarting the effect.
  const callbacks = useRef({ onSuccess, onError });
  useEffect(() => {
    callbacks.current = { onSuccess, onError };
  });

  const finish = useCallback(async (credential: PublicKeyCredential) => {
    setPending(true);
    try {
      await api("/auth/passkey/login", { method: "POST", body: { credential: credentialToJSON(credential) } });
      await callbacks.current.onSuccess();
      return true;
    } catch (err) {
      setPending(false);
      callbacks.current.onError(errorMessage(err));
      return false;
    }
  }, []);

  /**
   * Load fresh options (a challenge works once). With `withAutofill`, also
   * (re)start the autofill request. After a FAILED passkey login we don't
   * restart autofill: a passkey the server refuses would be offered and
   * refused again and again (and hit the rate limit). The button still works.
   */
  const prepare = useCallback(async (withAutofill: boolean) => {
    setReady(false);
    autofill.current?.abort();
    try {
      const request = api<Record<string, unknown>>("/auth/passkey/options", { method: "POST" });
      inflight.current = request;
      const json = await request.finally(() => {
        if (inflight.current === request) inflight.current = null;
      });
      if (!alive.current) return;
      options.current = toRequestOptions(json);
      setReady(true);
    } catch {
      // No passkey login this time; the password form still works.
      return;
    }
    if (!withAutofill || !canAutofill.current || !options.current) return;
    const controller = new AbortController();
    autofill.current = controller;
    navigator.credentials
      .get({ publicKey: options.current, mediation: "conditional", signal: controller.signal } as CredentialRequestOptions)
      .then(async (credential) => {
        if (!credential) return;
        if (!(await finish(credential as PublicKeyCredential))) void prepareRef.current(false);
      })
      .catch((err: unknown) => {
        // Aborted by the button or the page: nothing to say.
        if (!isCancel(err) && alive.current) callbacks.current.onError(passkeyErrorText(err));
      });
  }, [finish]);

  useEffect(() => {
    prepareRef.current = prepare;
  }, [prepare]);

  useEffect(() => {
    alive.current = true;
    void (async () => {
      const ok = await passkeysSupported();
      if (!alive.current || !ok) return;
      canAutofill.current = await autofillSupported();
      setSupported(true);
      await prepare(true);
    })();
    return () => {
      alive.current = false;
      autofill.current?.abort();
    };
  }, [prepare]);

  /** The "Face ID / fingerprint" button. Must run straight from the tap. */
  const start = useCallback(async () => {
    if (!options.current) return;
    autofill.current?.abort();
    setPending(true);
    let cancelled = false;
    try {
      const credential = (await navigator.credentials.get({ publicKey: options.current })) as PublicKeyCredential | null;
      if (!credential) throw new DOMException("No credential", "NotAllowedError");
      if (await finish(credential)) return;
    } catch (err) {
      setPending(false);
      cancelled = isCancel(err);
      if (!cancelled) {
        callbacks.current.onError(err instanceof ApiError ? errorMessage(err) : passkeyErrorText(err));
      }
    }
    // New challenge for the next try; autofill comes back only after a cancel.
    void prepare(cancelled);
  }, [finish, prepare]);

  /**
   * Wait until no options request is running. Call before the PASSWORD
   * login: the options request carries the pre-login session; if its answer
   * came back after the login, its new (empty) session cookie would replace
   * the logged-in one.
   */
  const waitIdle = useCallback(async () => {
    try {
      await inflight.current;
    } catch {
      // Failed options: nothing to wait for.
    }
  }, []);

  return { supported, ready, pending, start, waitIdle };
}
