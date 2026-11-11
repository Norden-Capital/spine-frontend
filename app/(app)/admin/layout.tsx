import { requireUser } from "@/lib/auth";
import { NotAllowed } from "@/components/auth/not-allowed";

// Admin pages: the user must be logged in AND have role ADMIN. Blocks on
// the server like the (app) layout, so nothing flashes before the check.
// The backend also refuses /api/admin/* for non-admins.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser("/admin/users");
  if (user.role !== "ADMIN") return <NotAllowed />;
  return children;
}
