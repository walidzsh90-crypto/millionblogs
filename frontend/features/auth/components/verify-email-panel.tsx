"use client";

import { useState } from "react";
import Link from "next/link";

import { authApi } from "@/features/auth/api/auth-api";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

import { AuthMessage } from "./auth-message";

export function VerifyEmailPanel({ locale, token }: { locale: Locale; token: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function verify() {
    setStatus("pending");
    setMessage("");

    try {
      await authApi.verifyEmail({ token });
      setStatus("success");
      setMessage("Email verified. You can continue to your dashboard.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Email verification failed");
    }
  }

  return (
    <div className="grid gap-4">
      {!token ? <AuthMessage type="error">Verification token is missing.</AuthMessage> : null}
      {status === "error" ? <AuthMessage type="error">{message}</AuthMessage> : null}
      {status === "success" ? <AuthMessage type="success">{message}</AuthMessage> : null}
      <button type="button" onClick={verify} disabled={!token || status === "pending"} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
        {status === "pending" ? "Verifying email" : "Verify email"}
      </button>
      <Link href={localizedPath(locale, "/dashboard")} className="text-sm font-semibold text-primary">
        Go to dashboard
      </Link>
    </div>
  );
}
