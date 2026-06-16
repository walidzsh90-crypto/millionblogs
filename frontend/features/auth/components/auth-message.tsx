import type { ReactNode } from "react";

type AuthMessageProps = {
  type: "error" | "success" | "info";
  children: ReactNode;
};

const styles = {
  error: "border-danger/30 bg-danger/10 text-danger",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-info/30 bg-info/10 text-info"
};

export function AuthMessage({ type, children }: AuthMessageProps) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm leading-6 ${styles[type]}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
