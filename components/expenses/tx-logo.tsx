"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/expenses/category-icon";

type Props = { logoUrls?: string[] | null; icon: string };

/**
 * The shop's logo (from the API's `logoUrls`) in the round icon slot.
 * Tries each URL in order; when one fails (or is a tiny blank picture) it
 * moves to the next, and after the last one it shows the category icon.
 * It fills the circle it is put in (rows 33, hero 44, picker 48).
 */
export function TxLogo({ logoUrls, icon }: Props) {
  const urls = logoUrls ?? [];
  // A new list starts again at the first URL.
  return <LogoChain key={urls.join("\n")} urls={urls} icon={icon} />;
}

/** Smaller than this (px) = a blank placeholder, not a real logo. */
const MIN_WIDTH = 8;

function LogoChain({ urls, icon }: { urls: string[]; icon: string }) {
  const [index, setIndex] = useState(0);
  const src = urls[index];

  if (!src) return <CategoryIcon name={icon} />;

  // Only move on once per URL (onError and the mount check can both fire).
  const next = () => setIndex((cur) => (cur === index ? cur + 1 : cur));

  return (
    // eslint-disable-next-line @next/next/no-img-element -- outside logo URLs in a list; next/image adds nothing here.
    <img
      key={src}
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      // White tile in light and dark, so dark or odd logos look clean.
      className="size-full rounded-full bg-white object-contain p-[18%] ring-1 ring-black/5 dark:ring-white/10"
      onError={next}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth < MIN_WIDTH) next();
      }}
      // An image from the server HTML can finish before React listens: check once on mount.
      ref={(img) => {
        if (img?.complete && img.naturalWidth < MIN_WIDTH) next();
      }}
    />
  );
}
