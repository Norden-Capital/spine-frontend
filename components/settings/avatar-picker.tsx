"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet, IconCheckGlyph, IconEdit, IconRepeat, IconRestore, SpButton } from "@/components/spine-ui";
import { NoticeBox } from "@/components/admin/notice";
import { UserAvatar } from "@/components/nav/user-avatar";
import { api, errorMessage } from "@/lib/api";
import { randomAvatarSeed } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const COUNT = 12;

/** "default" = back to the default face (seed null). */
type Choice = string | "default";
const DEFAULT: Choice = "default";

/** The saved custom face first (if any), then random ones up to 12. */
function makeOptions(saved: string | null): string[] {
  const list = saved ? [saved] : [];
  while (list.length < COUNT) list.push(randomAvatarSeed());
  return list;
}

/**
 * The face on the Settings profile card is a button: it opens the
 * "Choose your picture" sheet. It sits over the kit ProfileHero's
 * initials circle (64, 40 from the top, 17 from the left), because the
 * kit card has no picture slot.
 */
export function ProfileAvatarButton({
  seed,
  isDefault,
  name,
}: {
  seed: string;
  isDefault: boolean;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change your picture"
        aria-haspopup="dialog"
        data-testid="avatar-button"
        className="absolute top-[40px] left-[17px] rounded-full outline-none focus-visible:ring-3 focus-visible:ring-white active:scale-95 motion-reduce:active:scale-100"
      >
        <UserAvatar seed={seed} size={64} className="ring-0" />
        <span
          aria-hidden
          className="absolute -right-[2px] -bottom-[2px] flex size-[24px] items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text) ring-2 ring-(--sp-card-front) [&_svg]:size-[12px] [&_svg]:stroke-2"
        >
          <IconEdit />
        </span>
      </button>
      <AvatarPickerSheet open={open} onOpenChange={setOpen} seed={seed} isDefault={isDefault} name={name} />
    </>
  );
}

function AvatarPickerSheet({
  open,
  onOpenChange,
  seed,
  isDefault,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed: string;
  isDefault: boolean;
  name: string;
}) {
  const router = useRouter();
  const saved: Choice = isDefault ? DEFAULT : seed;
  const [options, setOptions] = useState<string[]>([]);
  const [choice, setChoice] = useState<Choice>(saved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  // Fresh options each time the sheet opens (random: only in the browser).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setOptions(makeOptions(isDefault ? null : seed));
      setChoice(saved);
      setError(null);
    }
  }

  /** 12 new faces; the saved custom face stays first so it is never lost. */
  function shuffle() {
    const list = makeOptions(isDefault ? null : seed);
    setOptions(list);
    if (choice !== DEFAULT && !list.includes(choice)) setChoice(saved);
  }

  async function save() {
    if (choice === saved) {
      onOpenChange(false);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api("/me/avatar", { method: "PATCH", body: { seed: choice === DEFAULT ? null : choice } });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  // Radio group keys: arrows move and pick (like native radios).
  const all: Choice[] = [...options, DEFAULT];
  function onKeyDown(e: React.KeyboardEvent) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let index = all.indexOf(choice);
    if (e.key in keys) index = (index + keys[e.key] + all.length) % all.length;
    else if (e.key === "Home") index = 0;
    else if (e.key === "End") index = all.length - 1;
    else return;
    e.preventDefault();
    setChoice(all[index]);
    groupRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus();
  }
  // The checked radio gets the Tab stop; if none is visible, the first one.
  const tabStop = all.includes(choice) ? choice : all[0];

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
      title="Choose your picture"
      description="A drawn face shows next to your name everywhere in Spine."
      footer={
        <div className="flex flex-col gap-[8px]">
          <SpButton variant="secondary" icon={<IconRepeat />} onClick={shuffle} disabled={pending} data-testid="avatar-shuffle">
            Shuffle
          </SpButton>
          <SpButton onClick={save} disabled={pending} data-testid="avatar-save">
            {pending ? "Saving…" : "Save"}
          </SpButton>
        </div>
      }
    >
      <div className="flex flex-col gap-[14px] pt-[4px]">
        {error && <NoticeBox notice={{ kind: "error", text: error }} />}
        <div
          ref={groupRef}
          role="radiogroup"
          aria-label={`Picture for ${name}`}
          onKeyDown={onKeyDown}
          className="flex flex-col gap-[14px]"
        >
          <div className="grid grid-cols-4 gap-[10px]">
            {options.map((s, i) => {
              const checked = choice === s;
              return (
                <button
                  key={`${i}-${s}`}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={`Picture ${i + 1}${s === seed && !isDefault ? " (current)" : ""}`}
                  tabIndex={tabStop === s ? 0 : -1}
                  data-index={i}
                  data-testid="avatar-option"
                  onClick={() => setChoice(s)}
                  className="relative mx-auto flex size-[64px] items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--sp-sheet)"
                >
                  <UserAvatar
                    seed={s}
                    size={64}
                    className={checked ? "ring-3 ring-(--sp-card-front)" : undefined}
                  />
                  {checked && <Check />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            role="radio"
            aria-checked={choice === DEFAULT}
            tabIndex={tabStop === DEFAULT ? 0 : -1}
            data-index={all.length - 1}
            data-testid="avatar-default"
            onClick={() => setChoice(DEFAULT)}
            className={cn(
              "flex min-h-[52px] w-full items-center gap-[12px] rounded-[16px] px-[12px] text-left text-[0.875rem] font-medium text-(--sp-text) outline-none transition hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
              choice === DEFAULT && "ring-2 ring-(--sp-card-front)"
            )}
          >
            {isDefault ? (
              <UserAvatar seed={seed} size={33} />
            ) : (
              <span
                aria-hidden
                className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) [&_svg]:size-[16px] [&_svg]:stroke-[1.7]"
              >
                <IconRestore />
              </span>
            )}
            <span className="min-w-0 flex-1">
              Use default
              <span className="mt-[3px] block text-[0.6875rem] font-normal text-(--sp-text-muted)">
                {isDefault ? "Your picture now" : "The face Spine gave you"}
              </span>
            </span>
            {choice === DEFAULT && (
              <span
                aria-hidden
                className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-(--sp-card-front) text-white [&_svg]:size-[12px]"
              >
                <IconCheckGlyph />
              </span>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

function Check() {
  return (
    <span
      aria-hidden
      className="absolute right-0 bottom-0 flex size-[22px] items-center justify-center rounded-full bg-(--sp-card-front) text-white ring-2 ring-(--sp-sheet) [&_svg]:size-[12px]"
    >
      <IconCheckGlyph />
    </span>
  );
}
