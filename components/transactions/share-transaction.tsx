"use client";

import { useEffect, useRef, useState } from "react";
import { Share } from "iconsax-react";
import { SpButton } from "@/components/spine-ui";

/**
 * Share a COMPANY transaction (never a wallet one): the phone's share sheet
 * with a short summary and the link to its page. The page itself still needs
 * a login: no public link, no proof files, no amount in the address.
 * No share sheet (most computers): copy the summary + link instead.
 */
export function ShareTransaction({ title, text, path }: { title: string; text: string; path: string }) {
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function show(message: string) {
    setNote(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), 2500);
  }

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Closed by the user, or not allowed: nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      show("Link copied");
    } catch {
      show("Could not copy the link");
    }
  }

  return (
    <div className="relative flex">
      <SpButton
        size="md"
        variant="secondary"
        className="w-full"
        icon={<Share variant="Bulk" color="currentColor" size={24} aria-hidden />}
        onClick={() => void share()}
      >
        Share
      </SpButton>
      <p
        role="status"
        aria-live="polite"
        className={
          note
            ? "pointer-events-none absolute inset-x-0 -top-[34px] mx-auto w-fit rounded-full bg-(--sp-chip-active) px-[12px] py-[6px] text-[0.75rem] leading-snug font-medium whitespace-nowrap text-(--sp-chip-active-text) shadow-md"
            : "sr-only"
        }
      >
        {note}
      </p>
    </div>
  );
}
