import type { ReactNode } from "react";

import { SurfaceLayout } from "@/shared/components/layout/surface-layout";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <SurfaceLayout surface="auth">{children}</SurfaceLayout>;
}
