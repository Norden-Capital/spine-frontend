// The Spine app icon, drawn for next/og ImageResponse (app/icon.tsx,
// app/apple-icon.tsx). Same design as the email logo: Lucide "wallet-cards"
// (ISC license) in #111111 on a full white square. No border and no rounded
// corners: iOS rounds the home-screen icon itself.

/** @param ratio How much of the square the icon fills (0–1). */
export function AppIconArt({ size, ratio }: { size: number; ratio: number }) {
  const icon = Math.round(size * ratio);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#111111"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 7h18" />
        <path d="M3 11h3.75a2 2 0 0 1 1.6.8l.45.6a4 4 0 0 0 6.4 0l.45-.6a2 2 0 0 1 1.6-.8H21" />
      </svg>
    </div>
  );
}
