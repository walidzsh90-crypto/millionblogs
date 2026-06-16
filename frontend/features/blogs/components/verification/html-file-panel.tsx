"use client";

type HtmlFilePanelProps = {
  token: string;
  blogUrl: string;
};

export function HtmlFilePanel({ token, blogUrl }: HtmlFilePanelProps) {
  const fullUrl = new URL(blogUrl).origin;
  const fileName = `millionblogs-${token}.html`;
  const fileContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>MillionBlogs Verification</title>
</head>
<body>
  <p>millionblogs-verify: ${token}</p>
</body>
</html>`;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h4 className="font-semibold text-foreground">HTML file verification</h4>
      <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted">
        <li>
          Create a file named <code className="text-foreground">{fileName}</code>{" "}
          with the following content:
        </li>
      </ol>
      <pre className="mt-3 overflow-x-auto rounded-md bg-background p-4 text-sm text-foreground">
        {fileContent}
      </pre>
      <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted" start={3}>
        <li>
          Upload the file to the root of your website ({fullUrl}/{fileName}).
        </li>
        <li>
          Ensure the file is publicly accessible at{" "}
          <code className="text-foreground">
            {fullUrl}/{fileName}
          </code>
          .
        </li>
        <li>
          Click &ldquo;Check verification&rdquo; below to confirm.
        </li>
      </ol>
    </div>
  );
}
