"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";

import { supportApi } from "@/features/support/api/support-api";

export default function CreateTicketPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const ticket = await supportApi.create({
        subject: subject.trim(),
        body: body.trim() || undefined,
      });
      router.push(localizedPath(locale, `/dashboard/support/${ticket.id}`));
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to create ticket");
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push(localizedPath(locale, "/dashboard/support"));
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-3xl" aria-labelledby="create-ticket-title">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Support</p>
        <h1 id="create-ticket-title" className="mt-1 text-3xl font-semibold text-foreground">
          Create a ticket
        </h1>
        <p className="mt-2 text-sm text-muted">
          Describe your issue and our support team will get back to you.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
            {submitError && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {submitError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ticket-subject" className="text-sm font-semibold text-foreground">
                Subject <span className="text-danger">*</span>
              </label>
              <input
                id="ticket-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`min-h-11 rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted ${errors.subject ? "border-danger" : "border-border"}`}
                placeholder="Brief summary of your issue"
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? "ticket-subject-error" : undefined}
              />
              {errors.subject && (
                <p id="ticket-subject-error" className="text-xs text-danger">
                  {errors.subject}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ticket-body" className="text-sm font-semibold text-foreground">
                Description
              </label>
              <textarea
                id="ticket-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-32 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
                placeholder="Detailed description of your issue..."
                rows={6}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit ticket"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="min-h-11 rounded-md border border-border px-6 text-sm font-semibold text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
