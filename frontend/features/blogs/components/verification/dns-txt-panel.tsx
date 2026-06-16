"use client";

type DnsTxtPanelProps = {
  token: string;
  blogUrl: string;
};

export function DnsTxtPanel({ token, blogUrl }: DnsTxtPanelProps) {
  const domain = new URL(blogUrl).hostname;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h4 className="font-semibold text-foreground">DNS TXT record verification</h4>
      <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted">
        <li>
          Log in to your domain&apos;s DNS management panel.
        </li>
        <li>
          Create a new <strong>TXT record</strong> with the following values:
        </li>
      </ol>
      <div className="mt-3 grid gap-3 rounded-md bg-background p-4 text-sm">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <span className="font-semibold text-foreground">Name/Host:</span>
          <span className="text-muted">@</span>
          <span className="font-semibold text-foreground">Type:</span>
          <span className="text-muted">TXT</span>
          <span className="font-semibold text-foreground">Value:</span>
          <span className="break-all font-mono text-primary">{token}</span>
          <span className="font-semibold text-foreground">TTL:</span>
          <span className="text-muted">3600 (or default)</span>
        </div>
      </div>
      <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted" start={4}>
        <li>
          Save the DNS record. Propagation may take a few minutes.
        </li>
        <li>
          Click &ldquo;Check verification&rdquo; below to confirm.
        </li>
      </ol>
    </div>
  );
}
