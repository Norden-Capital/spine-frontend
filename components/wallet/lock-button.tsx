"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLock } from "@/components/spine-ui";
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
      className="inline-flex min-h-[44px] items-center py-[8px] gap-[8px] rounded-full bg-(--sp-panel) px-[18px] text-[0.8125rem] leading-snug font-medium text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] disabled:opacity-50 [&_svg]:size-[18px]"
    >
      <IconLock aria-hidden />
      {pending ? "Locking…" : "Lock wallet"}
    </button>
  );
}
