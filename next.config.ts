import type { NextConfig } from "next";

// Read once so a missing value fails visibly at startup rather than silently
// producing a `undefined/...` destination.
const BACKEND_URL = process.env.BACKEND_URL;

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  redirects() {
    // Settings opens on its first tab. Done here so the redirect happens
    // before anything renders.
    return [{ source: "/settings", destination: "/settings/account", permanent: false }];
  },
  rewrites() {
    if (!BACKEND_URL) {
      console.warn(
        "[next.config] BACKEND_URL is not set — /api/* will 404. Copy .env.example to .env.local."
      );
      return [];
    }

    // Same-origin proxy: the browser only calls `/api/...` on this site, and
    // Next forwards it to the backend on the server. This keeps the http
    // backend out of the https page (no mixed content) and avoids CORS.
    //
    // `/api` must be repeated in the destination: only the named parameter is
    // carried over, not the literal prefix in `source`.
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
