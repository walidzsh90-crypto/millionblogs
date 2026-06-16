import type { ReactNode } from "react";

import { SurfaceLayout } from "@/shared/components/layout/surface-layout";

export default function FounderLayout({ children }: { children: ReactNode }) {
  return <SurfaceLayout surface="founder">{children}</SurfaceLayout>;
}
