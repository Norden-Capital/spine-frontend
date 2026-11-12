// Profile pictures: black & white drawn faces (DiceBear "Notionists",
// art by Zoish, CC0 1.0; DiceBear code MIT). Drawn here from a seed, on
// the server or in the browser. No call to any outside host.
import { createAvatar } from "@dicebear/core";
import * as notionists from "@dicebear/notionists";

/** What PATCH /api/me/avatar accepts: 1-64 letters, digits or "-". */
export const AVATAR_SEED_PATTERN = /^[A-Za-z0-9-]{1,64}$/;

/** Soft light circle behind the face: the black lines stay visible in dark mode too. */
const BACKGROUND = "f3f3f5";

const MAX_CACHED = 300;
const cache = new Map<string, string>();

/** The face for a seed, as a "data:image/svg+xml" URI. Same seed = same face. Memoized. */
export function avatarDataUri(seed: string): string {
  const hit = cache.get(seed);
  if (hit) return hit;
  const uri = createAvatar(notionists, { seed, backgroundColor: [BACKGROUND] }).toDataUri();
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(seed, uri);
  return uri;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** A new random seed that matches AVATAR_SEED_PATTERN, e.g. "k3Fq9-Zp2xW". Browser only. */
export function randomAvatarSeed(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => LETTERS[b % LETTERS.length]);
  return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
}

/** The seed to draw for a user: their avatarSeed, else (older backend) their id or name. */
export function seedOf(user: { avatarSeed?: string | null; id?: string; name?: string } | null | undefined): string {
  return user?.avatarSeed || user?.id || user?.name || "spine";
}
