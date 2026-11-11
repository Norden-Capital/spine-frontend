"use client";

// Inline script that runs once, while the HTML is parsed (before paint).
// On the client it renders as text/plain, so React does not warn and the
// browser never runs it again (from the Next.js "preventing flash" guide).
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
