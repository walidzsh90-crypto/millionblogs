"use client";

import { ErrorState } from "@/shared/components/feedback/error-state";

export default function BlogError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Blog profile is unavailable" message={error.message} reset={reset} />;
}
