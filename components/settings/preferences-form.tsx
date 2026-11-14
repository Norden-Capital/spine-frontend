"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheckGlyph, IconChevronRight, IconClock, IconSearch } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import {
  formatDateTime,
  todayIn,
  type DateFormat,
  type Font,
  type Preferences,
  type TextSize,
  type Theme,
} from "@/lib/prefs";
import { usePrefs } from "@/components/prefs/prefs-provider";
import {
  BottomSheet,
  FontCards,
  IconTile,
  Segmented,
  SpField,
  SpInput,
  SpPanel,
  SpRow,
  TextSizeControl,
  ThemeCards,
  type TextSizeValue,
  type ThemeValue,
} from "@/components/spine-ui";
import { cn } from "@/lib/utils";
import { formatRate, rateOf, walletCurrencyOf } from "@/lib/wallet-types";
import { CurrencySwitch } from "@/components/wallet/currency-switch";
import { SettingsNotice } from "./settings-notice";

// Backend values <-> kit values.
const THEME_TO_KIT: Record<Theme, ThemeValue> = { LIGHT: "light", DARK: "dark", SYSTEM: "auto" };
const THEME_FROM_KIT: Record<ThemeValue, Theme> = { light: "LIGHT", dark: "DARK", auto: "SYSTEM" };
const SIZE_TO_KIT: Record<TextSize, TextSizeValue> = { SMALL: "small", NORMAL: "normal", LARGE: "large" };
const SIZE_FROM_KIT: Record<TextSizeValue, TextSize> = { small: "SMALL", normal: "NORMAL", large: "LARGE" };

const FONTS: { value: Font; label: string; hint?: string; family: string }[] = [
  { value: "GEIST", label: "Poppins", hint: "Default", family: "var(--font-poppins)" },
  { value: "INTER", label: "Inter", family: "var(--font-inter)" },
  { value: "MANROPE", label: "Manrope", family: "var(--font-manrope)" },
  { value: "SYSTEM", label: "System", family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
];

/** Each format shown with today's day and month, like the mock ("12/11", "11/12", "2026-11-12"). */
function dateFormatItems(today: string): { value: DateFormat; label: string }[] {
  const [y, m, d] = today.split("-");
  return [
    { value: "DD/MM/YYYY", label: `${d}/${m}` },
    { value: "MM/DD/YYYY", label: `${m}/${d}` },
    { value: "YYYY-MM-DD", label: `${y}-${m}-${d}` },
  ];
}

/** "UTC−5" for a zone (from the browser's own zone data). */
function utcOffset(zone: string): string {
  try {
    const name =
      new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? "";
    return name.replace("GMT", "UTC").replace("-", "−") || "UTC";
  } catch {
    return "";
  }
}

/**
 * Preferences save as soon as you pick (no Save button: one tap on a phone).
 * The change shows at once; if saving fails, it goes back and says so.
 */
export function PreferencesForm() {
  const router = useRouter();
  const { prefs, zone, deviceZone, setPrefs } = usePrefs();
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [zoneOpen, setZoneOpen] = useState(false);

  async function save(change: Partial<Preferences>) {
    const before = prefs;
    const next = { ...prefs, ...change };
    setPrefs(next);
    setStatus(null);
    try {
      await api("/me/preferences", { method: "PUT", body: next });
      setStatus({ kind: "ok", text: "Saved." });
      // Dates drawn on the server (account page, lists) use the new format/zone.
      // Wallet totals (server pages) use the new default currency / rate.
      if ("dateFormat" in change || "timeZone" in change || "walletCurrency" in change || "walletUsdRate" in change)
        router.refresh();
    } catch (err) {
      setPrefs(before);
      setStatus({ kind: "error", text: `Not saved. ${errorMessage(err)}` });
    }
  }

  const now = new Date().toISOString();
  const offset = utcOffset(zone);

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {status?.text}
      </p>
      {status?.kind === "error" && <SettingsNotice kind="error">{status.text}</SettingsNotice>}

      <SpPanel title="Theme" description="Auto follows your phone (light or dark).">
        <ThemeCards
          value={THEME_TO_KIT[prefs.theme]}
          onValueChange={(v) => THEME_FROM_KIT[v] !== prefs.theme && save({ theme: THEME_FROM_KIT[v] })}
        />
      </SpPanel>

      <SpPanel title="Text size">
        <TextSizeControl
          value={SIZE_TO_KIT[prefs.textSize]}
          onValueChange={(v) => SIZE_FROM_KIT[v] !== prefs.textSize && save({ textSize: SIZE_FROM_KIT[v] })}
        />
      </SpPanel>

      <SpPanel title="Font">
        <FontCards
          value={prefs.font}
          options={FONTS}
          onValueChange={(v) => v !== prefs.font && save({ font: v as Font })}
        />
      </SpPanel>

      <SpPanel title="Dates and time">
        <div className="rounded-[16px] bg-(--sp-card-front) px-[14px] py-[14px] text-(--sp-card-front-text)">
          <p className="text-[0.625rem] leading-snug text-(--sp-card-front-muted)">Today looks like this</p>
          {/* The minute can differ between server and phone render. */}
          <p suppressHydrationWarning className="mt-[8px] text-[1.25rem] leading-snug font-medium tabular-nums">
            {formatDateTime(now, { dateFormat: prefs.dateFormat, zone }).replace(" ", " · ")}
          </p>
          <p className="mt-[6px] truncate text-[0.6875rem] leading-normal text-(--sp-card-front-muted)">
            {prettyZone(zone)}
            {offset ? ` (${offset})` : ""}
          </p>
        </div>
        <div className="mt-[16px] space-y-[16px]">
          <SpField label="Date format">
            <Segmented
              label="Date format"
              surface="panel"
              value={prefs.dateFormat}
              items={dateFormatItems(todayIn(zone))}
              onValueChange={(v) => v !== prefs.dateFormat && save({ dateFormat: v as DateFormat })}
            />
          </SpField>

          <SpField label="Time zone">
            <SpRow
              className="bg-(--sp-soft) pl-[12px]"
              leading={
                <IconTile tone="sun">
                  <IconClock />
                </IconTile>
              }
              title={prefs.timeZone ? prettyZone(prefs.timeZone) : "Follow my phone"}
              subtitle={prefs.timeZone ? "Tap to change" : `Now: ${prettyZone(deviceZone)}`}
              onClick={() => setZoneOpen(true)}
              trailing={<IconChevronRight aria-hidden className="size-[18px] shrink-0 text-(--sp-text-faint)" />}
            />
          </SpField>
        </div>
      </SpPanel>

      <SpPanel title="Wallet currency" description="Only for your private wallet. The company stays in USD.">
        <div className="space-y-[16px]">
          <SpField
            label="Default currency"
            hint="New expenses, goals, budgets and repeats start with it. You can change it on each one."
          >
            <CurrencySwitch
              label="Default currency"
              surface="panel"
              long
              value={walletCurrencyOf(prefs.walletCurrency)}
              onChange={(v) => v !== prefs.walletCurrency && save({ walletCurrency: v })}
            />
          </SpField>
          <RateField
            // A new saved value (or a failed save going back) starts the field over.
            key={prefs.walletUsdRate}
            saved={prefs.walletUsdRate}
            onSave={(walletUsdRate) => save({ walletUsdRate })}
          />
        </div>
      </SpPanel>

      <ZonePicker
        open={zoneOpen}
        onOpenChange={setZoneOpen}
        value={prefs.timeZone}
        deviceZone={deviceZone}
        onPick={(timeZone) => {
          setZoneOpen(false);
          void save({ timeZone });
        }}
      />
    </>
  );
}

/** "10,5" -> 10.5; null if not a rate the backend takes (> 0, ≤ 1000, up to 4 decimals). */
function parseRate(raw: string): number | null {
  const cleaned = raw.trim().replace(/[\s ']/g, "").replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,4})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n > 0 && n <= 1000 ? n : null;
}

/** "1 USD = [10.00] MAD": saved when you leave the field or press Enter (if valid and changed). */
function RateField({ saved, onSave }: { saved: string; onSave: (rate: string) => void }) {
  const [text, setText] = useState(() => formatRate(rateOf(saved)));
  const [error, setError] = useState<string | null>(null);

  function commit() {
    const n = parseRate(text);
    if (n === null) {
      setError("Enter a rate above 0, like 10.00.");
      return;
    }
    setError(null);
    const value = formatRate(n);
    setText(value);
    if (n !== Number(saved)) onSave(value);
  }

  return (
    <SpField label="Exchange rate" hint="Used to add MAD and USD together in your totals." error={error ?? undefined}>
      <div className="flex items-center gap-[10px]">
        <span className="shrink-0 text-[0.875rem] font-medium text-(--sp-text)">1 USD =</span>
        <SpInput
          inputMode="decimal"
          autoComplete="off"
          aria-label="MAD for 1 USD"
          className="text-right tabular-nums"
          value={text}
          aria-invalid={Boolean(error) || undefined}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <span className="shrink-0 text-[0.875rem] font-medium text-(--sp-text)">MAD</span>
      </div>
    </SpField>
  );
}

function prettyZone(zone: string) {
  return zone.replaceAll("_", " ");
}

function ZonePicker({
  open,
  onOpenChange,
  value,
  deviceZone,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  deviceZone: string;
  onPick: (zone: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const zones = useMemo(() => Intl.supportedValuesOf("timeZone"), []);
  const q = query.trim().toLowerCase().replaceAll(" ", "_");
  const shown = q ? zones.filter((z) => z.toLowerCase().includes(q)) : zones;

  const row = (zone: string | null, text: string) => {
    const on = zone === value;
    return (
      <button
        key={zone ?? "auto"}
        type="button"
        role="option"
        aria-selected={on}
        onClick={() => onPick(zone)}
        className={cn(
          "flex min-h-[48px] w-full items-center gap-[12px] rounded-[16px] px-[12px] py-[8px] text-left text-[0.8125rem] text-(--sp-text) outline-none hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
          on && "bg-(--sp-soft) font-medium"
        )}
      >
        <span className="min-w-0 flex-1 break-words">{text}</span>
        {on ? (
          <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text)">
            <IconCheckGlyph aria-hidden className="size-[13px]" />
          </span>
        ) : null}
      </button>
    );
  };

  return (
    // Fixed height: the sheet must not jump while the list gets shorter.
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
      title="Time zone"
      className="h-[85dvh]"
    >
      <div className="sticky top-0 z-10 bg-(--sp-sheet) pb-[8px]">
        <SpInput
          type="search"
          surface="panel"
          icon={<IconSearch />}
          aria-label="Search time zones"
          placeholder="Search, e.g. Toronto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div role="listbox" aria-label="Time zones" className="space-y-[2px]">
        {!q && row(null, `Follow my phone (${prettyZone(deviceZone)})`)}
        {shown.map((z) => row(z, prettyZone(z)))}
        {shown.length === 0 && (
          <p className="px-[12px] py-[24px] text-center text-[0.8125rem] text-(--sp-text-muted)">No time zone found.</p>
        )}
      </div>
    </BottomSheet>
  );
}
