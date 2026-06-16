"use client";

type MetaTagPanelProps = {
  token: string;
  blogUrl: string;
};

export function MetaTagPanel({ token, blogUrl }: MetaTagPanelProps) {
  const metaTag = `<meta name="millionblogs-verify" content="${token}" />`;
  const fullUrl = new URL(blogUrl).origin;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h4 className="font-semibold text-foreground">Meta tag verification</h4>
      <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted">
        <li>
          Open your website&apos;s <code className="text-foreground">&lt;head&gt;</code> section.
        </li>
        <li>
          Add the following meta tag inside <code className="text-foreground">&lt;head&gt;</code>:
        </li>
      </ol>
      <pre className="mt-3 overflow-x-auto rounded-md bg-background p-4 text-sm text-foreground">
        {metaTag}
      </pre>
      <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted" start={3}>
        <li>
          Save the changes and publish your site so the tag is publicly visible at{" "}
          <code className="text-foreground">{fullUrl}</code>.
        </li>
        <li>
          Click &ldquo;Check verification&rdquo; below to confirm.
        </li>
      </ol>
    </div>
  );
}
