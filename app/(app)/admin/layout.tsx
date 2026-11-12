import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canSeeUsers } from "@/lib/auth-types";
import { AdminTabs } from "@/components/nav/admin-tabs";

// Admin pages: only owners and admins. Employees never see them: they are
// sent home before anything renders (this layout blocks on the server).
// The backend also refuses /api/admin/* for them.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser("/admin/users");
  if (!canSeeUsers(user.role)) redirect("/");
  return (
    <div className="flex flex-col gap-4">
      <AdminTabs />
      {children}
    </div>
  );
}
