import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_LIST } from "./list";

// Index of the redesigned page mocks (dev only): /ui-pages.html

export const metadata: Metadata = { title: "Page mocks", robots: { index: false, follow: false } };

export default function PageMocksIndex() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto w-full max-w-[430px] px-4 py-8">
      <h1 className="text-xl font-semibold">Spine · page mocks</h1>
      <p className="mt-1 text-sm text-neutral-500">Redesigned pages (not wired). Kit parts: /ui-kit.html</p>
      <ul className="mt-6 divide-y">
        {MOCK_LIST.map((m) => (
          <li key={m.name} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span>{m.title}</span>
            <span className="flex gap-3">
              <Link className="underline" href={`/ui-pages.html/${m.name}-light`}>
                Light
              </Link>
              <Link className="underline" href={`/ui-pages.html/${m.name}-dark`}>
                Dark
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
