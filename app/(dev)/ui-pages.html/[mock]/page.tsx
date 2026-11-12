import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { spineFont } from "@/components/spine-ui";
import "@/components/spine-ui/tokens.css";
import { MockView } from "../mocks";
import { MOCK_LIST, THEMES } from "../list";

// One redesigned page as a full mock, in one theme: /ui-pages.html/<name>-<light|dark>.
// Dev only (404 in production). The dot keeps it out of proxy.ts (no login).

export const metadata: Metadata = { title: "Page mock", robots: { index: false, follow: false } };

// Dev mock: blocking render is fine (no instant shell needed).
export const instant = false;

export function generateStaticParams() {
  return MOCK_LIST.flatMap((m) => THEMES.map((t) => ({ mock: `${m.name}-${t}` })));
}

export default async function MockPage({ params }: { params: Promise<{ mock: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mock } = await params;
  const theme = mock.endsWith("-dark") ? "dark" : "light";
  const name = mock.replace(/-(light|dark)$/, "");
  if (!MOCK_LIST.some((m) => m.name === name)) notFound();

  return (
    <div
      id="mock"
      className={`${theme} ${spineFont.variable} sp sp-poppins relative mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-(--sp-bg) px-(--sp-gutter) pt-[12px] text-(--sp-text)`}
      style={{ colorScheme: theme }}
    >
      <MockView name={name} />
    </div>
  );
}
