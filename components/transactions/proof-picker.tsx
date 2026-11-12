"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Paperclip, RotateCcw } from "lucide-react";
import { errorMessage, uploadFile } from "@/lib/api";
import { formatSize, MAX_FILE_BYTES, MAX_FILES, type FileRef } from "@/lib/transactions-types";
import { BottomSheet, ProofTiles, SpButton } from "@/components/spine-ui";
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
 * Proofs: "Add proof" tile -> "Take photo" (camera) or "Choose file" (image or PDF). Up to 5,
 * 10 MB each. Each file uploads as soon as it is picked; a failed one stays
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
  /** "page" = white tiles on the gray page (form); "panel" = inside a white panel. */
  surface?: "page" | "panel";
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploads = useRef(new Map<string, AbortController>());
  const [limitNote, setLimitNote] = useState<string | null>(null);
  /** The "Take photo / Choose file" sheet. */
  const [chooser, setChooser] = useState(false);

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
  const failed = items.filter((it) => it.status === "error");
  const help = optional
    ? `A photo of the receipt, or a PDF. Up to ${MAX_FILES}, 10 MB each.`
    : `Add at least one: a photo of the receipt, or a PDF. Up to ${MAX_FILES}, 10 MB each.`;

  return (
    <div className="flex flex-col gap-[10px]">
      {/* Kit ProofTiles: "Add proof" tile first (opens Take photo / Choose
          file), then one tile per file. Upload state shows under the name. */}
      <ProofTiles
        surface={surface}
        addLabel="Add proof"
        onAdd={full ? undefined : () => setChooser(true)}
        onRemove={(key) => {
          const it = items.find((x) => x.key === key);
          if (it) remove(it);
        }}
        files={items.map((it) => ({
          id: it.key,
          name: it.name,
          size:
            it.status === "uploading"
              ? `Uploading… ${Math.round(it.progress * 100)}%`
              : it.status === "error"
                ? "Not uploaded"
                : formatSize(it.size),
          url:
            it.contentType.startsWith("image/") && (it.preview || it.ref)
              ? (it.preview ?? `/api/files/${encodeURIComponent(it.ref!.id)}`)
              : undefined,
        }))}
      />

      {items.some((it) => it.status === "uploading") && (
        <div
          className="h-[4px] overflow-hidden rounded-full bg-(--sp-soft)"
          role="progressbar"
          aria-label="Uploading proof"
          aria-valuenow={uploadPercent(items)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="block h-full bg-(--sp-card-front) transition-[width]" style={{ width: `${uploadPercent(items)}%` }} />
        </div>
      )}

      {failed.length > 0 && (
        <ul className="flex flex-col gap-[6px]" aria-label="Proofs not uploaded">
          {failed.map((it) => (
            <li
              key={it.key}
              className="flex min-h-[44px] items-center gap-[10px] rounded-[16px] bg-[color-mix(in_oklab,var(--sp-danger)_10%,transparent)] py-[6px] pr-[6px] pl-[14px]"
            >
              <span className="min-w-0 flex-1 leading-snug">
                <span className="block truncate text-[0.75rem] font-medium text-(--sp-text)">{it.name}</span>
                <span className="block text-[0.6875rem] text-(--sp-danger)">{it.error}</span>
              </span>
              {it.file && (
                <SpButton size="md" variant="secondary" icon={<RotateCcw />} onClick={() => void start(it)}>
                  Retry
                </SpButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {limitNote && <p className="px-[4px] text-[0.6875rem] text-(--sp-text-muted)">{limitNote}</p>}

      <p className={cn("px-[4px] text-[0.6875rem] leading-snug", invalid ? "text-(--sp-danger)" : "text-(--sp-text-muted)")}>
        {help}
      </p>

      {/* Hidden inputs; the sheet buttons open them. Reset so the same file can be picked again. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Take photo"
        data-testid="proof-camera-input"
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
        aria-label="Choose file"
        data-testid="proof-file-input"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />

      <BottomSheet
        open={chooser}
        onOpenChange={setChooser}
        title="Add proof"
        description={help}
      >
        <div className="flex flex-col gap-[8px] pb-[4px]">
          <SpButton
            className="w-full"
            icon={<Camera />}
            onClick={() => {
              setChooser(false);
              cameraRef.current?.click();
            }}
          >
            Take photo
          </SpButton>
          <SpButton
            variant="secondary"
            className="w-full"
            icon={<Paperclip />}
            onClick={() => {
              setChooser(false);
              fileRef.current?.click();
            }}
          >
            Choose file
          </SpButton>
        </div>
      </BottomSheet>
    </div>
  );
}

/** Average upload progress of the files still uploading, 0-100. */
function uploadPercent(items: ProofItem[]): number {
  const up = items.filter((it) => it.status === "uploading");
  if (up.length === 0) return 100;
  return Math.round((up.reduce((sum, it) => sum + it.progress, 0) / up.length) * 100);
}
