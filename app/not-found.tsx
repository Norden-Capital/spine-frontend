import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Unknown page. The home-screen app has no browser back button, so always
// offer a way home.
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">This page does not exist.</p>
      <Link href="/" className={buttonVariants({ size: "lg", className: "h-11" })}>
        Go home
      </Link>
    </main>
  );
}
