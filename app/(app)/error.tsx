"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50svh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm text-muted-foreground">
        Something went wrong while loading this page. The server may be down.
      </p>
      <Button size="lg" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
