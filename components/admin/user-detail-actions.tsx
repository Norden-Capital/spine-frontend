"use client";

import { useState } from "react";
import type { AdminUser } from "@/lib/auth-types";
import { NoticeBox, type Notice } from "./notice";
import { UserActions } from "./user-actions";

/** Result message + "Manage" rows on a user's page (rows only if canManage). */
export function UserDetailActions({ user }: { user: AdminUser }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  if (!user.canManage && !notice) return null;
  return (
    <>
      {notice && <NoticeBox notice={notice} />}
      {user.canManage && <UserActions user={user} onNotice={setNotice} />}
    </>
  );
}
