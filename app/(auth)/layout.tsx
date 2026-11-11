import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Guest-only pages (login, forgot password, set password): only for people
// NOT logged in. The check blocks on the server (no <Suspense>), so a
// logged-in user is sent to "/" before the guest page can render.
export const instant = false;

// Second guard (proxy.ts is the first). It asks the backend (GET
// /api/auth/me), so an expired cookie (401) still shows the page and never
// loops. If the backend is down, the page shows too.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-2xl font-semibold tracking-tight">Spine</p>
        {children}
      </div>
    </main>
  );
}
