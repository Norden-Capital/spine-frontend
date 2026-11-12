"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/expenses/category-icon";

/**
 * The shop's logo (from the API's `logoUrl`) in the round icon slot, or the
 * category icon when there is no logo or the picture fails to load.
 * It fills the circle it is put in (rows 33, hero 44, picker 48).
 */
export function TxLogo({ logoUrl, icon }: { logoUrl?: string | null; icon: string }) {
  // The src that failed; a new logoUrl gets a new try.
  const [failed, setFailed] = useState<string | null>(null);

  if (!logoUrl || failed === logoUrl) return <CategoryIcon name={icon} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- API image behind the session cookie; next/image adds nothing here.
    <img
      key={logoUrl}
      src={logoUrl}
      alt=""
      loading="lazy"
      decoding="async"
      className="size-full rounded-full bg-white object-contain p-[18%] ring-1 ring-black/5 dark:ring-white/10"
      onError={() => setFailed(logoUrl)}
      // An image from the server HTML can fail before React listens: check once on mount.
      ref={(img) => {
        if (img?.complete) img.decode().catch(() => setFailed(logoUrl));
      }}
    />
  );
}
