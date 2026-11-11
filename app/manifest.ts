import type { MetadataRoute } from "next";

// Minimal web app manifest so iOS opens the home-screen icon full screen
// ("standalone"). Not a PWA: no service worker, no offline mode.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spine",
    short_name: "Spine",
    description: "Spine expense tracker",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
