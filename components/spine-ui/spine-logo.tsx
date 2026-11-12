import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export type SpineLogoProps = {
  className?: string;
};

/** The Spine logo: Lucide "wallet-cards" (same as public/email/spine-logo.png). */
export function SpineLogo({ className }: SpineLogoProps) {
  return <WalletCards aria-label="Spine" role="img" className={cn("size-[20px]", className)} strokeWidth={1.9} />;
}
