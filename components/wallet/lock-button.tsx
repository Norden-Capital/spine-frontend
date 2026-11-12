"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";

/** Lock the wallet now (back to the PIN pad). */
export function LockWalletButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void api("/wallet/lock", { method: "POST" })
          .catch(() => {})
          .finally(() => router.refresh());
      }}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-(--sp-panel) px-4 text-[13px] text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) disabled:opacity-50"
    >
      <Lock className="size-4" aria-hidden />
      {pending ? "Locking…" : "Lock wallet"}
    </button>
  );
}
