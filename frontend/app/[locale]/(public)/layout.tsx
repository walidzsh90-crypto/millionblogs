import type { ReactNode } from "react";

import { SurfaceLayout } from "@/shared/components/layout/surface-layout";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <SurfaceLayout surface="public">{children}</SurfaceLayout>;
}
