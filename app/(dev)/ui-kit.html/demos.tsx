"use client";

import { useState } from "react";
import { Check, ScanFace, SlidersHorizontal } from "lucide-react";
import {
  BottomSheet,
  BottomSheetClose,
  FilterChip,
  FilterChips,
  PinDots,
  PinPad,
  SpButton,
} from "@/components/spine-ui";

// Interactive parts for the /ui-kit.html preview (client only).

/** PIN entry: type 4 digits; "1234" is right, anything else shakes red. */
export function PinDemo() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(0);
  const [ok, setOk] = useState(false);

  function digit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setOk(false);
    if (next.length < 4) {
      setPin(next);
      setError(0);
      return;
    }
    if (next === "1234") {
      setPin(next);
      setOk(true);
    } else {
      setPin("");
      setError((e) => e + 1);
    }
  }

  return (
    <div className="space-y-[32px] py-[8px]">
      <div className="space-y-[16px] text-center leading-none">
        <p className="text-[16px] font-medium">{ok ? "Wallet unlocked" : "Enter your PIN"}</p>
        <p className="text-[11px] text-(--sp-text-muted)">Try 1234. Anything else shows the error.</p>
      </div>
      <PinDots length={4} filled={pin.length} error={error > 0} errorKey={error} />
      <PinPad
        onDigit={digit}
        onDelete={() => {
          setPin((p) => p.slice(0, -1));
          setOk(false);
        }}
        extraKey={{ label: "Use Face ID", content: <ScanFace />, onPress: () => setOk(true) }}
      />
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All", count: 24 },
  { id: "travel", label: "Travel", count: 6 },
  { id: "meals", label: "Meals", count: 9 },
  { id: "office", label: "Office", count: 5 },
  { id: "software", label: "Software", count: 4 },
];

export function ChipsDemo() {
  const [active, setActive] = useState("all");
  return (
    <FilterChips label="Filter expenses">
      {FILTERS.map((f) => (
        <FilterChip
          key={f.id}
          label={f.label}
          count={f.count}
          active={active === f.id}
          onClick={() => setActive(f.id)}
        />
      ))}
    </FilterChips>
  );
}

/** Bottom sheet, rendered inside this block so it keeps the block's theme. */
export function SheetDemo({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [period, setPeriod] = useState("month");
  const [container, setContainer] = useState<HTMLElement | null>(null);

  return (
    <div ref={setContainer}>
      <SpButton variant="secondary" icon={<SlidersHorizontal />} onClick={() => setOpen(true)}>
        Open bottom sheet
      </SpButton>
      {container ? (
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          container={container}
          title="Show expenses"
          description="Pick a period. You can change it at any time."
          footer={
            <BottomSheetClose>
              <SpButton className="w-full">Apply</SpButton>
            </BottomSheetClose>
          }
        >
          <div className="space-y-[8px]">
            {[
              ["week", "This week"],
              ["month", "This month"],
              ["quarter", "This quarter"],
              ["year", "This year"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriod(id)}
                aria-pressed={period === id}
                className="flex h-[52px] w-full items-center justify-between rounded-[16px] bg-(--sp-soft) px-[16px] text-[13px] leading-none font-medium text-(--sp-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
              >
                {label}
                {period === id ? <Check className="size-[18px] stroke-2" aria-hidden /> : null}
              </button>
            ))}
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
}
