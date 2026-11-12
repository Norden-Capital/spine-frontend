import { redirect, unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Guest-only pages (login, forgot password, set password): only for people
// NOT logged in. The check blocks on the server (no <Suspense>), so a
// logged-in user is sent to "/" before the guest page can render.
export const instant = false;

// Second guard (proxy.ts is the first). It asks the backend (GET
// /api/auth/me), so an expired cookie (401) still shows the page and never
// loops. If the backend is down, the page shows too.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch((err: unknown) => {
    // Let Next.js internal signals through; a real error = show the page.
    unstable_rethrow(err);
    return null;
  });
  if (user) redirect("/");

  return (
    // Kit page: gray background (body), 18px sides, phone width. Each page
    // starts with the logo (AuthHeader), no "Spine" word.
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-(--sp-gutter) pt-[40px] pb-[32px] text-(--sp-text)">
      {children}
    </main>
  );
}
