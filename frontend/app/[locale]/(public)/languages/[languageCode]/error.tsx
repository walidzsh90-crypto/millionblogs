"use client";

import { ErrorState } from "@/shared/components/feedback/error-state";

export default function LanguageError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Language page is unavailable" message={error.message} reset={reset} />;
}
