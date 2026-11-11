import Link from "next/link";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth-types";
import { LogoutButton } from "@/components/auth/logout-button";

// Private pages must wait for the session check: no page, "Loading…" or
// empty state may show before we know who the user is. So this layout
// blocks on the server (no <Suspense> around the check) and redirect()
// happens before anything renders. On a link click, the old page stays
// visible until the new one is ready.
export const instant = false;

// Second guard (proxy.ts is the first): ask the backend (GET /api/auth/me)
// who the user is.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const wanted = safeNextPath((await headers()).get("x-spine-path"));
  const user = await requireUser(wanted);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-4 px-4">
          <Link href="/" className="font-semibold">
            Spine
          </Link>
          {user.role === "ADMIN" && (
            <nav className="flex gap-3 text-sm text-muted-foreground">
              <Link href="/admin/users" className="hover:text-foreground">
                Users
              </Link>
            </nav>
          )}
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
