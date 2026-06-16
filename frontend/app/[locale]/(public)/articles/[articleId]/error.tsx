"use client";

import { ErrorState } from "@/shared/components/feedback/error-state";

export default function ArticleError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Article preview is unavailable" message={error.message} reset={reset} />;
}
