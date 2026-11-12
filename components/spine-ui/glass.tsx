/*
 * Glass values from liquid-glass-react by Max Rovensky (MIT):
 * https://github.com/rdev/liquid-glass-react — src/index.tsx, at rest (no
 * pointer offset, as on a phone). Used by BalanceCard `glass` (tokens.css
 * .sp-glass-card). Kept: the backdrop blur + saturate and the
 * two 1.5px specular rims (screen + overlay). Left out: the "overLight" dark
 * layers (they turn a flat yellow card orange / black), the SVG displacement
 * warp, because WebKit (every iPhone browser) does not render
 * `backdrop-filter: url()` (bug 245510), and the pointer tracking.
 *
 * MIT License, Copyright (c) Max Rovensky. Permission is hereby granted,
 * free of charge, to any person obtaining a copy of this software, to deal in
 * the Software without restriction, subject to: the above copyright notice
 * and this permission notice shall be included in all copies or substantial
 * portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
 * WARRANTY OF ANY KIND.
 */

// Rim gradient at rest (mouseOffset 0): 135deg, stops 33% / 66%.
const rim = (a: number, b: number) =>
  `linear-gradient(135deg, rgb(255 255 255 / 0) 0%, rgb(255 255 255 / ${a}) 33%, rgb(255 255 255 / ${b}) 66%, rgb(255 255 255 / 0) 100%)`;
const RIM_SHADOW = "0 0 0 0.5px rgb(255 255 255 / 0.5) inset, 0 1px 3px rgb(255 255 255 / 0.25) inset, 0 1px 4px rgb(0 0 0 / 0.35)";
// Only the 1.5px ring of the rim layer shows.
const RING_MASK = {
  padding: "1.5px",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
} as const;

/**
 * The two light rims of the glass (screen + overlay blend), as in the
 * library. Put it as the first child of a `relative` glass box.
 */
export function GlassRims({ radius = "var(--sp-radius)" }: { radius?: string }) {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
        style={{ ...RING_MASK, borderRadius: radius, background: rim(0.12, 0.4), boxShadow: RIM_SHADOW }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{ ...RING_MASK, borderRadius: radius, background: rim(0.32, 0.6), boxShadow: RIM_SHADOW }}
      />
    </>
  );
}
