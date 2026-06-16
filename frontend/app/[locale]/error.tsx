"use client";

import { ErrorState } from "@/shared/components/feedback/error-state";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState message={error.message} reset={reset} />;
}
