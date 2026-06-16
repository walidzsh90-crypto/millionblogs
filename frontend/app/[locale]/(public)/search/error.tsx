"use client";

import { ErrorState } from "@/shared/components/feedback/error-state";

export default function SearchError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Search is unavailable" message={error.message} reset={reset} />;
}
