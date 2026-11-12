"use client";

import { useState } from "react";
import { IconChevronRight, IconClose, IconFile } from "@/components/spine-ui";
import { formatSize, type FileRef } from "@/lib/transactions-types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const fileUrl = (f: FileRef) => `/api/files/${encodeURIComponent(f.id)}`;
const isImage = (f: FileRef) => f.contentType.startsWith("image/");
/** "JPEG · 120 KB", "PDF · 1.2 MB". */
const typeLabel = (f: FileRef) =>
  f.contentType === "application/pdf" ? "PDF" : (f.contentType.split("/")[1] ?? "file").replace("jpeg", "jpg").toUpperCase();
const sizeLabel = (f: FileRef) => `${typeLabel(f)} · ${formatSize(f.size)}`;

/**
 * Proofs on the transaction page: one soft card, full width, one row per
 * file (thumbnail or PDF icon, name, type + size, "Open" + chevron).
 * No big stretched preview. Image: full-screen viewer. PDF: new tab.
 */
export function ProofGallery({ files }: { files: FileRef[] }) {
  const [open, setOpen] = useState<FileRef | null>(null);

  function openFile(f: FileRef) {
    if (isImage(f)) setOpen(f);
    else window.open(fileUrl(f), "_blank", "noopener");
  }
  const label = (f: FileRef) => `${isImage(f) ? "View" : "Open"} ${f.name}`;

  return (
    <>
      <ul aria-label="Proof files" className="flex flex-col overflow-hidden rounded-[16px] bg-(--sp-soft)">
        {files.map((f, i) => (
          <li key={f.id} className={i > 0 ? "border-t border-(--sp-divider)" : undefined}>
            <button
              type="button"
              data-testid="proof-file-row"
              onClick={() => openFile(f)}
              aria-label={label(f)}
              className="flex min-h-[64px] w-full items-center gap-[12px] py-[8px] pr-[10px] pl-[8px] text-left outline-none transition hover:bg-(--sp-soft-hover) focus-visible:ring-3 focus-visible:ring-(--sp-ring) focus-visible:ring-inset active:bg-(--sp-soft-hover) motion-reduce:transition-none"
            >
              <span className="flex size-[48px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-(--sp-panel) text-(--sp-text-muted) [&_svg]:size-[22px]">
                {isImage(f) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private file behind the session
                  <img src={fileUrl(f)} alt="" className="size-full object-cover" />
                ) : (
                  <IconFile />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] leading-normal font-medium text-(--sp-text)">{f.name}</span>
                <span className="block truncate text-[0.6875rem] leading-normal text-(--sp-text-muted)">{sizeLabel(f)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-[2px] text-[0.75rem] leading-normal font-medium text-(--sp-text-muted)">
                Open
                <IconChevronRight className="size-[18px] text-(--sp-text-faint)" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[100svh] max-h-none w-screen max-w-none flex-col gap-0 rounded-none bg-black p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white ring-0 sm:max-w-none"
        >
          <div className="flex items-center gap-[8px] px-[8px] py-[4px]">
            <DialogTitle className="min-w-0 flex-1 truncate px-[8px] text-[0.8125rem] leading-normal font-medium text-white">
              {open?.name}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="flex size-[44px] items-center justify-center rounded-full bg-white/15 outline-none hover:bg-white/25 focus-visible:ring-3 focus-visible:ring-white/50 active:scale-95 [&_svg]:size-[20px]"
            >
              <IconClose aria-hidden />
            </button>
          </div>
          {open && (
            // Pinch-zoom works on the phone (touch-action: pinch-zoom on the image).
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element -- private file behind the session */}
              <img src={fileUrl(open)} alt={open.name} className="max-h-full max-w-full touch-pinch-zoom object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
