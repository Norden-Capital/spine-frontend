import Link from "next/link";

// Shown when a logged-in user opens a page their role can't use (403).
export function NotAllowed() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-lg font-semibold">Not allowed</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only admins can open this page.</p>
      <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-4">
        Back home
      </Link>
    </div>
  );
}
