"use client";

import type { ComponentType } from "react";
import * as Lucide from "lucide-react";
import { LUCIDE_TO_SP } from "@/components/spine-ui/icons";

// Dev mocks only: `I.House`, `I.Search`… render the new Spine (iconsax Bulk)
// icon, or the old Lucide one for before/after shots (mock name ending in "-old").

type AnyIcon = ComponentType<{ className?: string; fill?: string }>;

let current: "sp" | "lucide" = "sp";
export function getIconSet() {
  return current;
}
export function setIconSet(set: "sp" | "lucide") {
  current = set;
}

const lucide = Lucide as unknown as Record<string, AnyIcon>;
const sp = LUCIDE_TO_SP as unknown as Record<string, AnyIcon>;

export const I = new Proxy({} as Record<string, AnyIcon>, {
  get: (_t, key: string) => (current === "sp" ? (sp[key] ?? lucide[key]) : lucide[key]),
});
