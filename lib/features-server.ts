// Server-only: optional server features (GET /api/features).
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";

export type Features = { ai: boolean };

export async function getFeatures(): Promise<Features> {
  try {
    const res = await backendGet("/features");
    return res.ok ? { ai: Boolean(((await res.json()) as Partial<Features>).ai) } : { ai: false };
  } catch (err) {
    unstable_rethrow(err);
    return { ai: false };
  }
}
