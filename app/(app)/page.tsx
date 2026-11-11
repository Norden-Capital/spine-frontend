import { requireUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

// Placeholder home. Real content comes in later modules.
export default async function HomePage() {
  // Same request as the layout check; React cache() makes it one backend call.
  const user = await requireUser("/");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Spine</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p>
          Logged in as <span className="font-medium">{user.email}</span> ({user.role})
        </p>
        <div>
          <LogoutButton variant="outline" size="lg" />
        </div>
      </CardContent>
    </Card>
  );
}
