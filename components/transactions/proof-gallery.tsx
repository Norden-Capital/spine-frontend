"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { formatSize, type FileRef } from "@/lib/transactions-types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const fileUrl = (f: FileRef) => `/api/files/${encodeURIComponent(f.id)}`;

/** Proofs on the transaction page. Image: full-screen viewer. PDF: new tab. */
export function ProofGallery({ files }: { files: FileRef[] }) {
  const [open, setOpen] = useState<FileRef | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2" aria-label="Proofs">
        {files.map((f) => {
          const isImage = f.contentType.startsWith("image/");
          const inner = (
            <>
              <span className="flex aspect-[4/3] items-center justify-center bg-muted">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private file behind the session
                  <img src={fileUrl(f)} alt="" className="size-full object-cover" loading="lazy" />
                ) : (
                  <FileText className="size-8 text-muted-foreground" aria-hidden />
                )}
              </span>
              <span className="flex min-w-0 flex-col px-2 py-1.5 text-left">
                <span className="truncate text-xs font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  {isImage ? formatSize(f.size) : `PDF · ${formatSize(f.size)}`}
                </span>
              </span>
            </>
          );
          const cls =
            "flex w-full flex-col overflow-hidden rounded-xl border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
          return (
            <li key={f.id}>
              {isImage ? (
                <button type="button" className={cls} onClick={() => setOpen(f)} aria-label={`View ${f.name}`}>
                  {inner}
                </button>
              ) : (
                <a href={fileUrl(f)} target="_blank" rel="noopener" className={cls} aria-label={`Open ${f.name}`}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[100svh] max-h-none w-screen max-w-none flex-col gap-0 rounded-none bg-black p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white ring-0 sm:max-w-none"
        >
          <div className="flex items-center gap-2 px-2">
            <DialogTitle className="min-w-0 flex-1 truncate px-2 text-sm font-medium text-white">{open?.name}</DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="flex size-11 items-center justify-center rounded-full outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/50"
            >
              <X className="size-6" aria-hidden />
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
