import type { Metadata } from "next";
import { backendGet } from "@/lib/auth";
import { SetPasswordForm, type TokenCheck, type TokenInfo } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set password",
  // The token is in the URL: never send it to other sites as a referrer.
  referrer: "no-referrer",
};

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

// The token is checked on the server, so the page shows the right state
// right away (no "Checking your link…" flash).
async function checkToken(token: string): Promise<TokenCheck> {
  if (!token) return { kind: "invalid" };
  try {
    const res = await backendGet(`/auth/token/${encodeURIComponent(token)}`);
    if (res.ok) return { kind: "ready", info: (await res.json()) as TokenInfo };
    if (res.status === 410 || res.status === 404) return { kind: "invalid" };
  } catch {
    // Backend down: show the "try again later" message.
  }
  return { kind: "error" };
}

export default async function SetPasswordPage({ searchParams }: PageProps<"/set-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  return <SetPasswordForm token={value} check={await checkToken(value)} />;
}
