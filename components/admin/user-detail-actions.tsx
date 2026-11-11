"use client";

import { useState } from "react";
import type { AdminUser } from "@/lib/auth-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserActions, type Notice } from "./user-actions";

/** Actions menu + result message on a user's page (menu only if canManage). */
export function UserDetailActions({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  return (
    <>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        {user.canManage && <UserActions user={user} showView={false} onNotice={setNotice} />}
      </div>
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
