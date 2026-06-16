"use client";

import { ErrorState } from "@/shared/components/feedback/error-state";

export default function CategoryError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Category page is unavailable" message={error.message} reset={reset} />;
}
