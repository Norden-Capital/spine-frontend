"use client";

// Web Push on this device (docs/push-api.md). One small shared store, so the
// Alerts gate, Settings and the hub row always show the same state.
//
// States:
// - loading:     not checked yet
// - unsupported: this browser can't do push (iPhone Safari not opened from the Home Screen, old iOS…)
// - disabled:    the server has no push keys (503 push_disabled): alerts are not locked
// - denied:      the person blocked notifications for Spine
// - off:         can push, but this device is not subscribed for me
// - on:          subscribed for me

import { useSyncExternalStore } from "react";
import { api, ApiError } from "@/lib/api";

export type PushState = "loading" | "unsupported" | "disabled" | "denied" | "off" | "on";

let state: PushState = "loading";
let started: Promise<void> | null = null;
let publicKey: string | null = null;
const listeners = new Set<() => void>();

function set(next: PushState) {
  state = next;
  listeners.forEach((l) => l());
}

export function usePushState(): PushState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => "loading"
  );
}

const noop = () => () => {};

/**
 * The device, read only in the browser. The server (and the first browser
 * render, for hydration) says "phone" and not iPhone; then the real value.
 */
export function useDevice(): { word: "phone" | "computer"; ios: boolean } {
  const word = useSyncExternalStore(noop, deviceWord, () => "phone" as const);
  const ios = useSyncExternalStore(noop, isIOS, () => false);
  return { word, ios };
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** iPhone / iPad (iPadOS says "Macintosh" but has touch). */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

/** "phone" or "computer", for "On on this phone". */
export function deviceWord(): "phone" | "computer" {
  if (typeof navigator === "undefined") return "phone";
  return isIOS() || /Android|Mobile/.test(navigator.userAgent) ? "phone" : "computer";
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

async function check(): Promise<void> {
  if (!pushSupported()) return set("unsupported");
  try {
    publicKey = (await api<{ publicKey: string }>("/push/key")).publicKey;
  } catch (err) {
    // No keys on the server: push is off for everyone, alerts stay open.
    if (err instanceof ApiError && err.code === "push_disabled") return set("disabled");
    // Network or other error: don't lock the alerts because of it.
    return set("disabled");
  }
  let reg: ServiceWorkerRegistration;
  try {
    reg = await registration();
  } catch {
    return set("unsupported");
  }
  if (Notification.permission === "denied") return set("denied");
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return set("off");
  try {
    const status = await api<{ subscribed: boolean }>(`/push/status?endpoint=${encodeURIComponent(sub.endpoint)}`);
    if (status.subscribed) return set("on");
    // The browser has one the server dropped (or it was the last person's): send it again.
    if (Notification.permission === "granted") {
      await api("/push/subscribe", { method: "POST", body: sub.toJSON() });
      return set("on");
    }
  } catch {
    // Fall through: ask again with the button.
  }
  set("off");
}

/** Check once per page load (or again with `force`, for "Check again"). */
export function startPush(force = false): Promise<void> {
  if (!started || force) {
    if (force) set("loading");
    started = check().catch(() => set("off"));
  }
  return started;
}

/**
 * Turn on: must run from a tap (iPhone only asks after a tap).
 * Returns null when done, or a short error text.
 */
export async function turnOnPush(): Promise<string | null> {
  if (!pushSupported()) {
    set("unsupported");
    return null;
  }
  // Ask first, in the same tap. The key was loaded by startPush().
  const permission = await Notification.requestPermission();
  if (permission === "denied") {
    set("denied");
    return null;
  }
  if (permission !== "granted") return "Notifications were not allowed. Please try again.";
  try {
    if (!publicKey) publicKey = (await api<{ publicKey: string }>("/push/key")).publicKey;
    const reg = await registration();
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
    await api("/push/subscribe", { method: "POST", body: sub.toJSON() });
    set("on");
    return null;
  } catch (err) {
    if (err instanceof ApiError && err.code === "push_disabled") {
      set("disabled");
      return null;
    }
    return err instanceof ApiError ? err.message : "Could not turn on notifications. Please try again.";
  }
}

/** Remove this device on the server, then in the browser. Used by "Turn off" and logout. */
export async function forgetPushDevice(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api("/push/subscribe", { method: "DELETE", body: { endpoint: sub.endpoint } });
}

export async function turnOffPush(): Promise<string | null> {
  try {
    await forgetPushDevice();
    const reg = await navigator.serviceWorker.getRegistration("/");
    await (await reg?.pushManager.getSubscription())?.unsubscribe();
    await navigator.clearAppBadge?.().catch(() => {});
    set("off");
    return null;
  } catch (err) {
    return err instanceof ApiError ? err.message : "Could not turn off notifications. Please try again.";
  }
}

/** The app icon count (Home Screen), when the browser can. */
export function showBadge(unread: number) {
  if (typeof navigator === "undefined" || !navigator.setAppBadge) return;
  (unread > 0 ? navigator.setAppBadge(unread) : navigator.clearAppBadge()).catch(() => {});
}
