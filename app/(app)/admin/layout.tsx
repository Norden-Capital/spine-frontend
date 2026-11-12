import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { AdminTabs } from "@/components/nav/admin-tabs";

// Admin pages: the owner only. For members this area does not exist:
// "Page not found" on the server, before anything renders (no redirect).
// The app layout already does this for a typed URL; this is the second
// check. The backend also refuses /api/admin/* for members.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser("/admin/users");
  if (!isOwner(user)) notFound();
  return (
    <div className="flex flex-col gap-[16px]">
      <AdminTabs />
      {children}
    </div>
  );
}
