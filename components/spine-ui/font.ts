import { Poppins } from "next/font/google";

/**
 * Spine UI font: Poppins (geometric sans, like the reference).
 * It is the app's DEFAULT font: put `spineFont.variable` on <html> and use
 * var(--font-poppins) for the default font preference. The kit inherits
 * the app font (a user who picks Inter gets Inter in the kit too).
 */
export const spineFont = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
