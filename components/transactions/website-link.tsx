import { ExternalLink } from "lucide-react";

/** A saved website (bare domain, e.g. "claude.ai") as a link that opens in a new tab. */
export function WebsiteLink({ domain }: { domain: string }) {
  return (
    <a
      href={`https://${domain}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-[44px] max-w-full items-center gap-[6px] underline underline-offset-2 [&_svg]:size-[14px] [&_svg]:shrink-0"
    >
      <span className="min-w-0 break-all">{domain}</span>
      <ExternalLink aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
