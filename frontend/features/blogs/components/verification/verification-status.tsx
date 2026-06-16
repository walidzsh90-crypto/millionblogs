import type { BlogResponse } from "../../api/blogs-api";
import { BlogStatusBadge } from "../blog-status-badge";

type VerificationStatusProps = {
  blog: BlogResponse;
};

export function VerificationStatus({ blog }: VerificationStatusProps) {
  const isVerified = blog.status === "verified";
  const verifiedDate = blog.verifiedAt
    ? new Date(blog.verifiedAt).toLocaleDateString()
    : null;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-lg font-semibold text-foreground">Verification</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Status
          </p>
          <div className="mt-1">
            <BlogStatusBadge status={blog.status} />
          </div>
        </div>

        {verifiedDate && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Verified
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {verifiedDate}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Trust level
          </p>
          <p className="mt-1 text-sm font-medium text-foreground capitalize">
            {blog.trustStatus}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Ownership
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {blog.status === "verified"
              ? "Ownership verified"
              : blog.status === "pending_verification"
                ? "Verification in progress"
                : "Not verified"}
          </p>
        </div>
      </div>

      {!isVerified && (
        <p className="mt-4 text-sm leading-6 text-muted">
          Verify your blog to unlock trust signals and improved discoverability for
          your content.
        </p>
      )}
    </div>
  );
}
