import type { Metadata } from "next";
import { safeNextPath } from "@/lib/auth-types";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

// A logged-in user is sent to "/" by proxy.ts and the (auth) layout.
// Search params are read here on the server, so the form renders at once
// (no empty <Suspense> fallback before it).
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, password } = await searchParams;
  return (
    <LoginForm
      next={safeNextPath(typeof next === "string" ? next : null)}
      passwordSet={password === "set"}
    />
  );
}
