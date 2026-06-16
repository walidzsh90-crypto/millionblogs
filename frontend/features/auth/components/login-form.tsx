"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/features/auth/api/auth-api";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { setSessionMarker } from "@/services/auth/session-marker";
import { tokenStore } from "@/services/auth/token-store";
import { getSafeRedirectPath } from "@/services/routing/safe-redirect";

import { AuthMessage } from "./auth-message";

type LoginFormProps = {
  locale: Locale;
  returnTo?: string;
};

export function LoginForm({ locale, returnTo }: LoginFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const result = await authApi.login({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      });

      tokenStore.setAccessToken(result.accessToken);
      setSessionMarker();
      router.push(getSafeRedirectPath(returnTo, localizedPath(locale, "/dashboard")));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {status === "error" ? <AuthMessage type="error">{message}</AuthMessage> : null}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground"
        />
      </div>
      <button type="submit" disabled={status === "pending"} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
        {status === "pending" ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
