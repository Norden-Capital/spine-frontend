import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/brand/app-icon-art";

// Browser tab icon (32px) and a larger icon (192px), same design as the
// apple-icon. The 32px one draws the wallet a bit bigger so it stays readable.
const ICONS = {
  small: { size: 32, ratio: 0.75 },
  large: { size: 192, ratio: 0.58 },
} as const;

export function generateImageMetadata() {
  return Object.entries(ICONS).map(([id, icon]) => ({
    id,
    contentType: "image/png",
    size: { width: icon.size, height: icon.size },
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const icon = ICONS[(await id) as keyof typeof ICONS] ?? ICONS.large;
  return new ImageResponse(<AppIconArt size={icon.size} ratio={icon.ratio} />, {
    width: icon.size,
    height: icon.size,
  });
}
