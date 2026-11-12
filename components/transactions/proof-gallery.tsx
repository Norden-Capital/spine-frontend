"use client";

import { useState } from "react";
import { IconClose } from "@/components/spine-ui";
import { formatSize, type FileRef } from "@/lib/transactions-types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProofTiles } from "@/components/spine-ui";

const fileUrl = (f: FileRef) => `/api/files/${encodeURIComponent(f.id)}`;

/** Proofs on the transaction page. Image: full-screen viewer. PDF: new tab. */
export function ProofGallery({ files }: { files: FileRef[] }) {
  const [open, setOpen] = useState<FileRef | null>(null);

  return (
    <>
      {/* Kit ProofTiles (soft tiles inside the panel). */}
      <ProofTiles
        files={files.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.contentType.startsWith("image/") ? formatSize(f.size) : `PDF · ${formatSize(f.size)}`,
          url: f.contentType.startsWith("image/") ? fileUrl(f) : undefined,
        }))}
        onOpen={(id) => {
          const f = files.find((x) => x.id === id);
          if (!f) return;
          if (f.contentType.startsWith("image/")) setOpen(f);
          else window.open(fileUrl(f), "_blank", "noopener");
        }}
      />

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
              <IconClose className="size-6" aria-hidden />
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
