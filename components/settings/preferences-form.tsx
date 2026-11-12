"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Search } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import {
  formatDate,
  type DateFormat,
  type Font,
  type Preferences,
  type TextSize,
  type Theme,
} from "@/lib/prefs";
import { usePrefs } from "@/components/prefs/prefs-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const THEMES: { value: Theme; label: string }[] = [
  { value: "LIGHT", label: "Light" },
  { value: "DARK", label: "Dark" },
  { value: "SYSTEM", label: "Auto" },
];

const SIZES: { value: TextSize; label: string; sample: string }[] = [
  { value: "SMALL", label: "Small", sample: "text-[14px]" },
  { value: "NORMAL", label: "Normal", sample: "text-[16px]" },
  { value: "LARGE", label: "Large", sample: "text-[18px]" },
];

const FONTS: { value: Font; label: string; family: string }[] = [
  { value: "GEIST", label: "Poppins (default)", family: "var(--font-poppins)" },
  { value: "INTER", label: "Inter", family: "var(--font-inter)" },
  { value: "MANROPE", label: "Manrope", family: "var(--font-manrope)" },
  { value: "SYSTEM", label: "System", family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
];

const DATE_FORMATS: DateFormat[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

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
      if ("dateFormat" in change || "timeZone" in change) router.refresh();
    } catch (err) {
      setPrefs(before);
      setStatus({ kind: "error", text: `Not saved. ${errorMessage(err)}` });
    }
  }

  const today = new Date().toISOString();

  return (
    <div className="flex flex-col gap-6">
      <p aria-live="polite" className="sr-only">
        {status?.text}
      </p>
      {status?.kind === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{status.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Look</CardTitle>
          <CardDescription>Changes show right away and are saved.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Group label="Theme">
            <Segmented
              label="Theme"
              options={THEMES.map((t) => ({ value: t.value, content: t.label }))}
              value={prefs.theme}
              onChange={(theme) => save({ theme })}
            />
            {prefs.theme === "SYSTEM" && (
              <p className="text-xs text-muted-foreground">Auto follows your phone (light or dark).</p>
            )}
          </Group>

          <Group label="Text size">
            <Segmented
              label="Text size"
              options={SIZES.map((s) => ({
                value: s.value,
                content: (
                  <span className="flex items-baseline gap-1.5">
                    <span className={cn("leading-none font-semibold", s.sample)}>Aa</span>
                    <span>{s.label}</span>
                  </span>
                ),
              }))}
              value={prefs.textSize}
              onChange={(textSize) => save({ textSize })}
            />
          </Group>

          <Group label="Font">
            <ChoiceList
              label="Font"
              options={FONTS.map((f) => ({
                value: f.value,
                content: (
                  <span style={{ fontFamily: f.family }} className="text-base">
                    {f.label}
                  </span>
                ),
              }))}
              value={prefs.font}
              onChange={(font) => save({ font })}
            />
          </Group>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dates and time</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Group label="Date format">
            <ChoiceList
              label="Date format"
              options={DATE_FORMATS.map((f) => ({
                value: f,
                content: (
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="font-mono text-sm">{f}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(today, { dateFormat: f, zone })}
                    </span>
                  </span>
                ),
              }))}
              value={prefs.dateFormat}
              onChange={(dateFormat) => save({ dateFormat })}
            />
          </Group>

          <Group label="Time zone">
            <button
              type="button"
              onClick={() => setZoneOpen(true)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="min-w-0 truncate">
                {prefs.timeZone ? prettyZone(prefs.timeZone) : `Auto (device: ${prettyZone(deviceZone)})`}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </Group>
        </CardContent>
      </Card>

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
    </div>
  );
}

function prettyZone(zone: string) {
  return zone.replaceAll("_", " ");
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{label}</h3>
      {children}
    </div>
  );
}

type Option<T> = { value: T; content: React.ReactNode };

/** A row of equal buttons, one chosen (like iOS segmented control). */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-muted p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => !on && onChange(o.value)}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg px-1 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.content}
          </button>
        );
      })}
    </div>
  );
}

/** A list of full-width rows, one chosen, with a check mark. */
function ChoiceList<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col divide-y overflow-hidden rounded-lg border">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => !on && onChange(o.value)}
            className={cn(
              "flex min-h-11 items-center gap-3 px-3 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted",
              on && "bg-muted/60"
            )}
          >
            <span className="flex min-w-0 flex-1">{o.content}</span>
            <Check className={cn("size-4 shrink-0", on ? "opacity-100" : "opacity-0")} aria-hidden />
          </button>
        );
      })}
    </div>
  );
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
          "flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted",
          on && "bg-muted/60 font-medium"
        )}
      >
        <span className="min-w-0 flex-1 break-words">{text}</span>
        <Check className={cn("size-4 shrink-0", on ? "opacity-100" : "opacity-0")} aria-hidden />
      </button>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      {/* Fixed height: the box must not jump while the list gets shorter. */}
      <DialogContent className="flex h-[85svh] flex-col gap-3 p-0 pt-4">
        <DialogHeader className="px-4">
          <DialogTitle>Time zone</DialogTitle>
        </DialogHeader>
        <div className="relative px-4">
          <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label="Search time zones"
            placeholder="Search, e.g. Toronto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
        <div role="listbox" aria-label="Time zones" className="min-h-0 flex-1 overflow-y-auto border-t pb-2">
          {!q && row(null, `Auto (device: ${prettyZone(deviceZone)})`)}
          {shown.map((z) => row(z, prettyZone(z)))}
          {shown.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No time zone found.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
