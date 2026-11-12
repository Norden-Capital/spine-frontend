"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { SpInput, type SpInputProps } from "./field";

export type SpPasswordInputProps = Omit<SpInputProps, "type" | "end">;

/** SpInput for passwords, with a 44 round "show / hide" button inside. */
export function SpPasswordInput(props: SpPasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <SpInput
      {...props}
      type={show ? "text" : "password"}
      end={
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          onClick={() => setShow((s) => !s)}
          className="flex size-[44px] items-center justify-center rounded-full text-(--sp-text-muted) outline-none hover:text-(--sp-text) focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[18px] [&_svg]:stroke-[1.8]"
        >
          {show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      }
    />
  );
}
