import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Manrope } from "next/font/google";
import { PREFS_HEAD_SCRIPT } from "@/lib/prefs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The other fonts a user can pick in Settings → Preferences. Not preloaded:
// most people keep the default, and the files load when a font is used.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: { default: "Spine", template: "%s · Spine" },
  description: "Spine expense tracker",
  // Name under the icon when added to the iPhone home screen. Not a PWA:
  // no "capable"/standalone mode, no manifest, no service worker.
  appleWebApp: { title: "Spine", capable: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Theme, font and text size are set on <html> by an inline script in <head>
// that reads a cookie, so they apply before the first paint (no flash) and
// this layout stays static. suppressHydrationWarning: the script changes
// <html> attributes before React hydrates.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_HEAD_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
