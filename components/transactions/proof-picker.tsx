"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Paperclip, RotateCcw, X } from "lucide-react";
import { errorMessage, uploadFile } from "@/lib/api";
import { formatSize, MAX_FILE_BYTES, MAX_FILES, type FileRef } from "@/lib/transactions-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** One proof in the form: already on the server, uploading, or failed. */
export type ProofItem = {
  key: string;
  name: string;
  contentType: string;
  size: number;
  /** Set once the server has it. */
  ref: FileRef | null;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
  /** Local preview (object URL) for a new image; existing images load from /api/files/{id}. */
  preview?: string;
  file?: File;
};

// Clear "not allowed" types only. An empty or generic type (e.g. some HEIC
// photos) goes to the server, which checks the real content.
const ACCEPTED = /^(image\/.+|application\/pdf|application\/octet-stream|)$/;

/** Photos bigger than this, or wider/taller than MAX_SIDE, are made smaller before upload. */
const SHRINK_ABOVE = 2 * 1024 * 1024;
const MAX_SIDE = 2560;

/**
 * Make a big photo smaller (JPEG 85%, max 2560 px) in the browser: faster on
 * a phone, and safely under proxy body limits. Falls back to the original
 * file if the browser can't read the image (e.g. HEIC outside Safari).
 */
async function shrinkPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SHRINK_ABOVE) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

export function proofFromRef(ref: FileRef): ProofItem {
  return { key: ref.id, name: ref.name, contentType: ref.contentType, size: ref.size, ref, status: "done", progress: 1 };
}

/**
 * Proofs: "Take photo" (camera) or "Choose file" (image or PDF). Up to 5,
 * 10 MB each. Each file uploads as soon as it is picked; a failed one stays
 * in the list with Retry, so nothing else in the form is lost.
 */
export function ProofPicker({
  items,
  onChange,
  invalid,
  optional = false,
}: {
  items: ProofItem[];
  onChange: (update: (items: ProofItem[]) => ProofItem[]) => void;
  invalid?: boolean;
  /** Wallet: a proof is not required. */
  optional?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploads = useRef(new Map<string, AbortController>());
  const [limitNote, setLimitNote] = useState<string | null>(null);

  // Stop uploads and free previews when the form goes away.
  useEffect(() => {
    const running = uploads.current;
    return () => running.forEach((c) => c.abort());
  }, []);
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const update = (key: string, change: Partial<ProofItem>) =>
    onChange((list) => list.map((it) => (it.key === key ? { ...it, ...change } : it)));

  async function start(item: ProofItem) {
    if (!item.file) return;
    const controller = new AbortController();
    uploads.current.set(item.key, controller);
    update(item.key, { status: "uploading", progress: 0, error: undefined });
    try {
      const file = await shrinkPhoto(item.file);
      if (file !== item.file) update(item.key, { size: file.size, name: file.name });
      const ref = await uploadFile<FileRef>(file, {
        signal: controller.signal,
        onProgress: (p) => update(item.key, { progress: p }),
      });
      update(item.key, { status: "done", progress: 1, ref });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      update(item.key, { status: "error", error: errorMessage(err) });
    } finally {
      uploads.current.delete(item.key);
    }
  }

  function add(files: FileList | null) {
    if (!files) return;
    setLimitNote(null);
    const room = MAX_FILES - items.length;
    const picked = [...files].slice(0, Math.max(0, room));
    if (files.length > room) setLimitNote(`You can add up to ${MAX_FILES} proofs.`);
    const fresh: ProofItem[] = picked.map((file) => {
      const isImage = file.type.startsWith("image/");
      const preview = isImage ? URL.createObjectURL(file) : undefined;
      if (preview) previews.current.push(preview);
      // Photos get smaller before upload, so only PDFs (and other files) are refused here.
      const tooBig = file.size > MAX_FILE_BYTES && !file.type.startsWith("image/");
      const wrongType = !ACCEPTED.test(file.type);
      return {
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name || "photo.jpg",
        contentType: file.type,
        size: file.size,
        ref: null,
        status: tooBig || wrongType ? "error" : "uploading",
        progress: 0,
        error: tooBig
          ? "Too big. The limit is 10 MB."
          : wrongType
            ? "Not allowed. Use a photo or a PDF."
            : undefined,
        preview,
        file: tooBig || wrongType ? undefined : file,
      };
    });
    onChange((list) => [...list, ...fresh]);
    fresh.filter((it) => it.status === "uploading").forEach((it) => void start(it));
  }

  function remove(item: ProofItem) {
    uploads.current.get(item.key)?.abort();
    onChange((list) => list.filter((it) => it.key !== item.key));
    setLimitNote(null);
  }

  const full = items.length >= MAX_FILES;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          disabled={full}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera aria-hidden />
          Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          disabled={full}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip aria-hidden />
          Choose file
        </Button>
      </div>
      {/* Hidden inputs; the buttons above open them. Reset so the same file can be picked again. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />

      {limitNote && <p className="text-sm text-muted-foreground">{limitNote}</p>}

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2" aria-label="Proofs">
          {items.map((it) => (
            <li
              key={it.key}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-xl border bg-card",
                it.status === "error" && "border-destructive/60"
              )}
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                {it.contentType.startsWith("image/") && (it.preview || it.ref) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private file behind the session; no image optimizer
                  <img
                    src={it.preview ?? `/api/files/${encodeURIComponent(it.ref!.id)}`}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <FileText className="size-8 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1 px-2 py-1.5">
                <span className="truncate text-xs font-medium">{it.name}</span>
                {it.status === "uploading" ? (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`Uploading ${it.name}`}
                      aria-valuenow={Math.round(it.progress * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <span className="block h-full bg-foreground" style={{ width: `${Math.round(it.progress * 100)}%` }} />
                    </span>
                    {Math.round(it.progress * 100)}%
                  </span>
                ) : it.status === "error" ? (
                  <span className="text-xs text-destructive">{it.error}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">{formatSize(it.size)}</span>
                )}
                {it.status === "error" && it.file && (
                  <button
                    type="button"
                    onClick={() => void start(it)}
                    className="flex min-h-9 items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    Retry
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(it)}
                aria-label={`Remove ${it.name}`}
                className="group absolute top-0 right-0 flex size-11 items-center justify-center rounded-full outline-none"
              >
                {/* 44px tap area, smaller visible circle. */}
                <span className="flex size-8 items-center justify-center rounded-full bg-background/90 shadow group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
                  <X className="size-4" aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={cn("text-sm", invalid ? "text-destructive" : "text-muted-foreground")}>
          {optional
            ? `You can add a photo of the receipt or a PDF. Up to ${MAX_FILES}, 10 MB each.`
            : `Add at least one proof: a photo of the receipt or a PDF. Up to ${MAX_FILES}, 10 MB each.`}
        </p>
      )}
    </div>
  );
}
