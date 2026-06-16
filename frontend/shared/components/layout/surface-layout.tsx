import type { ReactNode } from "react";

type SurfaceLayoutProps = {
  children: ReactNode;
  surface: "public" | "auth" | "dashboard" | "founder" | "admin";
};

export function SurfaceLayout({ children, surface }: SurfaceLayoutProps) {
  return (
    <main data-surface-layout={surface} className="min-h-screen">
      {children}
    </main>
  );
}
