import { requireUser } from "@/lib/auth";
import { displayName } from "@/lib/auth-types";
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
      <CardContent>
        <p>
          Logged in as <span className="font-medium break-all">{displayName(user)}</span> ({user.role})
        </p>
      </CardContent>
    </Card>
  );
}
