import type { ReactNode } from "react";

import { SurfaceLayout } from "@/shared/components/layout/surface-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SurfaceLayout surface="admin">{children}</SurfaceLayout>;
}
