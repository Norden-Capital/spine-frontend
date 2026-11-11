import { ImageResponse } from "next/og";
import { AppIconArt } from "@/components/brand/app-icon-art";

// iPhone "Add to Home Screen" icon: 180×180, full white square, icon ~58%.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconArt size={size.width} ratio={0.58} />, { ...size });
}
