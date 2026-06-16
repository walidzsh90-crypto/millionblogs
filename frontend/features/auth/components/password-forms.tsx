"use client";

import { useState, type FormEvent } from "react";

import { authApi } from "@/features/auth/api/auth-api";

import { AuthMessage } from "./auth-message";

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      await authApi.forgotPassword({ email: String(formData.get("email") ?? "") });
      setStatus("success");
      setMessage("If an account exists, password reset instructions will be sent.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Password reset request failed");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {status === "error" ? <AuthMessage type="error">{message}</AuthMessage> : null}
      {status === "success" ? <AuthMessage type="success">{message}</AuthMessage> : null}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground" />
      </div>
      <button type="submit" disabled={status === "pending"} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
        {status === "pending" ? "Sending instructions" : "Send reset instructions"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("pending");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      await authApi.resetPassword({
        token,
        password: String(formData.get("password") ?? "")
      });
      setStatus("success");
      setMessage("Password updated. You can now sign in.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Password reset failed");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {!token ? <AuthMessage type="error">Reset token is missing.</AuthMessage> : null}
      {status === "error" ? <AuthMessage type="error">{message}</AuthMessage> : null}
      {status === "success" ? <AuthMessage type="success">{message}</AuthMessage> : null}
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
          New password
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" required disabled={!token} className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground disabled:opacity-60" />
      </div>
      <button type="submit" disabled={status === "pending" || !token} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60">
        {status === "pending" ? "Updating password" : "Update password"}
      </button>
    </form>
  );
}
