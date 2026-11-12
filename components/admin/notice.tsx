import { cn } from "@/lib/utils";

export type Notice = { kind: "ok" | "error"; text: string };

/**
 * Result message after an action, in the kit style: a soft panel
 * (ok) or red text on a light red fill (error). Text in rem.
 */
export function NoticeBox({ notice, className }: { notice: Notice; className?: string }) {
  const error = notice.kind === "error";
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "rounded-[16px] px-[14px] py-[12px] text-[0.8125rem] leading-snug",
        error
          ? "bg-[color-mix(in_oklab,var(--sp-danger)_10%,var(--sp-panel))] text-(--sp-danger)"
          : "bg-(--sp-panel) text-(--sp-text)",
        className
      )}
    >
      {notice.text}
    </p>
  );
}
