import Link from "next/link";

export default function UserNotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-lg font-semibold">User not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This user does not exist, or you can&apos;t see them.</p>
      <Link href="/admin/users" className="mt-4 inline-flex h-11 items-center text-sm underline underline-offset-4">
        Back to users
      </Link>
    </div>
  );
}
