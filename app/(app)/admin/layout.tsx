import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canSeeUsers } from "@/lib/auth-types";

// Admin pages: only owners and admins. Employees never see them: they are
// sent home before anything renders (this layout blocks on the server).
// The backend also refuses /api/admin/* for them.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser("/admin/users");
  if (!canSeeUsers(user.role)) redirect("/");
  return children;
}
