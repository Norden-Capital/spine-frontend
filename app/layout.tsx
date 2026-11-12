import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Manrope } from "next/font/google";
import { PREFS_HEAD_SCRIPT } from "@/lib/prefs";
import { spineFont } from "@/components/spine-ui/font";
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
  // Opened from the iPhone home screen icon: full screen, no Safari bars.
  // Not a PWA: no service worker, no offline (see app/manifest.ts).
  appleWebApp: { title: "Spine", capable: true, statusBarStyle: "default" },
  // Next writes only the newer "mobile-web-app-capable"; older iOS reads this one.
  other: { "apple-mobile-web-app-capable": "yes" },
  // Static files in public/. iOS ignores a generated icon URL without a file
  // extension, so these are plain .png files.
  // - Tab icons (favicon.ico, icon-32/192): white rounded square, transparent
  //   corners. "?v=" makes browsers fetch them again after a change.
  // - apple-touch-icon: square and opaque on purpose (iOS rounds it itself).
  //   iOS also checks /apple-touch-icon(-precomposed).png on its own.
  icons: {
    icon: [
      { url: "/icon-32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  // Draw under the notch / home bar; globals.css pads with the safe areas.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eeeeee" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Theme, font and text size are set on <html> by an inline script in <head>
// that reads the look saved on this device (localStorage, else cookie), on
// every page, logged-in or not. So they apply before the first paint (no
// flash) and this layout stays static. suppressHydrationWarning: the script changes
// <html> attributes before React hydrates.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spineFont.variable} ${geistSans.variable} ${geistMono.variable} ${inter.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_HEAD_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
