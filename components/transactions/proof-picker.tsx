"use client";

import { useEffect, useRef, useState } from "react";
import { IconAttach, IconCamera, IconCloseGlyph, IconFile, IconRestore } from "@/components/spine-ui";
import { errorMessage, uploadFile } from "@/lib/api";
import { formatSize, MAX_FILE_BYTES, MAX_FILES, type FileRef } from "@/lib/transactions-types";
import { SpButton } from "@/components/spine-ui";
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
 * Proofs: two options on one row, "Take a photo" (camera) and "Upload a file"
 * (photo or PDF), then one row per file. Up to 5, 10 MB each. Each file uploads as soon as it is picked; a failed one stays
 * in the list with Retry, so nothing else in the form is lost.
 */
export function ProofPicker({
  items,
  onChange,
  invalid,
  optional = false,
  surface = "page",
}: {
  items: ProofItem[];
  onChange: (update: (items: ProofItem[]) => ProofItem[]) => void;
  invalid?: boolean;
  /** Wallet: a proof is not required. */
  optional?: boolean;
  /** "page" = white rows on the gray page (form); "panel" = inside a white panel. */
  surface?: "page" | "panel";
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
  const help = optional
    ? `A photo of the receipt, or a PDF. Up to ${MAX_FILES}, 10 MB each.`
    : `Add at least one: a photo of the receipt, or a PDF. Up to ${MAX_FILES}, 10 MB each.`;
  const optionBg = surface === "page" ? "bg-(--sp-panel)" : "bg-(--sp-soft)";
  const optionClass = cn(
    "flex min-h-[56px] w-full min-w-0 items-center justify-center gap-[10px] rounded-[16px] px-[12px] py-[8px] text-left text-(--sp-text) outline-none",
    "touch-manipulation transition-[transform,opacity,filter] duration-150 hover:brightness-95 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
    "focus-visible:ring-3 focus-visible:ring-(--sp-ring) disabled:pointer-events-none disabled:opacity-40",
    invalid && items.length === 0 && "ring-2 ring-(--sp-danger)",
    optionBg
  );
  const optionIcon =
    "flex size-[36px] shrink-0 items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text) [&_svg]:size-[18px] [&_svg]:stroke-[1.8]";

  return (
    <div className="flex flex-col gap-[10px]">
      {/* Two options on one row: the camera, or a photo / PDF from the phone. */}
      <div className="grid grid-cols-2 gap-[10px]">
        <button
          type="button"
          className={optionClass}
          disabled={full}
          data-testid="proof-take-photo"
          onClick={() => cameraRef.current?.click()}
        >
          <span className={optionIcon}>
            <IconCamera />
          </span>
          <span className="min-w-0 text-[0.8125rem] leading-tight font-medium break-words">Take a photo</span>
        </button>
        <button
          type="button"
          className={optionClass}
          disabled={full}
          data-testid="proof-upload-file"
          onClick={() => fileRef.current?.click()}
        >
          <span className={optionIcon}>
            <IconAttach />
          </span>
          <span className="min-w-0 text-[0.8125rem] leading-tight font-medium break-words">Upload a file</span>
        </button>
      </div>

      {full && (
        <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
          You have {MAX_FILES} proofs. Remove one to add another.
        </p>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-[8px]" aria-label="Proof files">
          {items.map((it) => {
            const url =
              it.contentType.startsWith("image/") && (it.preview || it.ref)
                ? (it.preview ?? `/api/files/${encodeURIComponent(it.ref!.id)}`)
                : undefined;
            const failed = it.status === "error";
            const percent = Math.round(it.progress * 100);
            return (
              <li
                key={it.key}
                data-testid="proof-row"
                className={cn(
                  "flex min-h-[60px] items-center gap-[10px] rounded-[16px] py-[8px] pr-[4px] pl-[8px]",
                  failed ? "bg-[color-mix(in_oklab,var(--sp-danger)_10%,transparent)]" : optionBg
                )}
              >
                <span className="flex size-[44px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-(--sp-soft) text-(--sp-text-muted) [&_svg]:size-[20px] [&_svg]:stroke-[1.6]">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="size-full object-cover" />
                  ) : (
                    <IconFile />
                  )}
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block truncate text-[0.8125rem] font-medium text-(--sp-text)">{it.name}</span>
                  {it.status === "uploading" ? (
                    <>
                      <span className="block text-[0.6875rem] text-(--sp-text-muted)">Uploading… {percent}%</span>
                      <span
                        className="mt-[4px] block h-[4px] overflow-hidden rounded-full bg-(--sp-soft)"
                        role="progressbar"
                        aria-label={`Uploading ${it.name}`}
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span
                          className="block h-full bg-(--sp-card-front) transition-[width]"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                    </>
                  ) : failed ? (
                    <span className="block text-[0.6875rem] text-(--sp-danger)">{it.error ?? "Not uploaded"}</span>
                  ) : (
                    <span className="block text-[0.6875rem] text-(--sp-text-muted)">{formatSize(it.size)}</span>
                  )}
                </span>
                {failed && it.file && (
                  <SpButton size="md" variant="secondary" icon={<IconRestore />} onClick={() => void start(it)}>
                    Retry
                  </SpButton>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${it.name}`}
                  onClick={() => remove(it)}
                  className="flex size-[44px] shrink-0 items-center justify-center rounded-full text-(--sp-text-muted) outline-none hover:bg-(--sp-soft-hover) focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[18px] [&_svg]:stroke-[2]"
                >
                  <IconCloseGlyph />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {limitNote && <p className="px-[4px] text-[0.6875rem] text-(--sp-text-muted)">{limitNote}</p>}

      <p className={cn("px-[4px] text-[0.6875rem] leading-snug", invalid ? "text-(--sp-danger)" : "text-(--sp-text-muted)")}>
        {help}
      </p>

      {/* Hidden inputs; the two options open them. Reset so the same file can be picked again. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Take a photo"
        data-testid="proof-camera-input"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp,application/pdf,.heic,.heif,.pdf"
        multiple
        className="hidden"
        aria-label="Upload a file"
        data-testid="proof-file-input"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
