import { cn } from "@/lib/utils";

/** Short message in a settings panel: "Saved." (green) or an error (red). Kit tokens, text in rem. */
export function SettingsNotice({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[16px] px-[14px] py-[12px] text-[0.8125rem] leading-snug font-medium break-words",
        kind === "error"
          ? "bg-[color-mix(in_oklab,var(--sp-danger)_10%,transparent)] text-(--sp-danger)"
          : "bg-[color-mix(in_oklab,var(--sp-success)_12%,transparent)] text-(--sp-success)"
      )}
    >
      {children}
    </p>
  );
}
