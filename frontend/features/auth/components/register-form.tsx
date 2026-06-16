"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/features/auth/api/auth-api";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { setSessionMarker } from "@/services/auth/session-marker";
import { tokenStore } from "@/services/auth/token-store";

import Link from "next/link";

import { AuthMessage } from "./auth-message";

export function RegisterForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const result = await authApi.register({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? "")
      });

      tokenStore.setAccessToken(result.accessToken);
      setSessionMarker();
      router.push(localizedPath(locale, "/dashboard"));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {status === "error" ? <AuthMessage type="error">{message}</AuthMessage> : null}
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
          Name
        </label>
        <input id="name" name="name" type="text" autoComplete="name" required className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground" />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground" />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground" />
        <p className="mt-2 text-xs leading-5 text-muted">Use at least 8 characters with uppercase, lowercase, number, and symbol.</p>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="agree"
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary"
          aria-describedby="agree-description"
        />
        <label htmlFor="agree" id="agree-description" className="text-xs leading-5 text-muted">
          I agree to the{" "}
          <Link href={localizedPath(locale, "/terms")} className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href={localizedPath(locale, "/privacy")} className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </label>
      </div>

      <button type="submit" disabled={status === "pending" || !agreed} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
        {status === "pending" ? "Creating account" : "Create account"}
      </button>
    </form>
  );
}
