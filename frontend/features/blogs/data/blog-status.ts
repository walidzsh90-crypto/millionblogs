export const BLOG_STATUSES = {
  draft: { label: "Draft", variant: "muted" as const },
  pending_verification: { label: "Pending Verification", variant: "warning" as const },
  verified: { label: "Verified", variant: "success" as const },
  rejected: { label: "Rejected", variant: "danger" as const },
  suspended: { label: "Suspended", variant: "danger" as const },
  archived: { label: "Archived", variant: "muted" as const },
} as const;

export type BlogStatus = keyof typeof BLOG_STATUSES;

export const TRUST_STATUSES = {
  new: { label: "New", variant: "muted" as const },
  verified: { label: "Trust Verified", variant: "success" as const },
  trusted: { label: "Trusted", variant: "success" as const },
  featured: { label: "Featured", variant: "promotion" as const },
} as const;

export type TrustStatus = keyof typeof TRUST_STATUSES;
