"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  blogsApi,
  type BlogResponse,
} from "@/features/blogs/api/blogs-api";
import {
  verificationApi,
  type OwnershipVerification,
  type VerificationMethod,
} from "@/features/blogs/api/verification-api";
import { MetaTagPanel } from "@/features/blogs/components/verification/meta-tag-panel";
import { DnsTxtPanel } from "@/features/blogs/components/verification/dns-txt-panel";
import { HtmlFilePanel } from "@/features/blogs/components/verification/html-file-panel";

const VERIFICATION_METHODS: Array<{
  key: VerificationMethod;
  label: string;
  description: string;
}> = [
  {
    key: "meta_tag",
    label: "Meta tag",
    description: "Add a meta tag to your site's <head>",
  },
  {
    key: "dns_txt",
    label: "DNS TXT record",
    description: "Add a TXT record to your domain",
  },
  {
    key: "html_file",
    label: "HTML file",
    description: "Upload a verification file to your server",
  },
];

export default function VerifyBlogPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const blogId = String(params.blogId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [verifications, setVerifications] = useState<OwnershipVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [blogData, vData] = await Promise.all([
        blogsApi.getById(blogId),
        verificationApi.list(blogId),
      ]);
      setBlog(blogData);
      setVerifications(vData);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load verification data");
    } finally {
      setIsLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    if (blogId) loadData();
  }, [blogId, loadData]);

  async function handleInitiate(method: VerificationMethod) {
    setIsInitiating(true);
    setActionMessage(null);
    try {
      const result = await verificationApi.initiate(blogId, { method });
      setCurrentToken(result.token);
      setSelectedMethod(method);
      setActionMessage({
        type: "success",
        text: "Verification initiated. Follow the instructions below.",
      });
      const vData = await verificationApi.list(blogId);
      setVerifications(vData);
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message ?? "Failed to initiate verification",
      });
    } finally {
      setIsInitiating(false);
    }
  }

  async function handleCheck() {
    if (!selectedMethod) return;
    setIsChecking(true);
    setActionMessage(null);
    try {
      const pending = verifications.find(
        (v) => v.method === selectedMethod && v.status === "pending"
      );
      if (!pending) {
        setActionMessage({
          type: "error",
          text: "No pending verification found. Initiate verification first.",
        });
        setIsChecking(false);
        return;
      }
      const result = await verificationApi.check(blogId, pending.id);
      if (result.status === "verified") {
        setActionMessage({
          type: "success",
          text: "Ownership verified successfully! Your blog now has a verified badge.",
        });
      } else if (result.status === "failed") {
        setActionMessage({
          type: "error",
          text: result.errorMessage ?? "Verification failed. Check the instructions and try again.",
        });
      } else {
        setActionMessage({
          type: "success",
          text: "Verification is still pending. It may take a few minutes to propagate.",
        });
      }
      const vData = await verificationApi.list(blogId);
      setVerifications(vData);
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message ?? "Failed to check verification",
      });
    } finally {
      setIsChecking(false);
    }
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState
          title="Failed to load verification data"
          message={error}
          reset={loadData}
        />
      </main>
    );
  }

  if (isLoading || !blog) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-3xl" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
      </main>
    );
  }

  const latestVerification = verifications[0] ?? null;
  const isVerified = blog.status === "verified";

  return (
    <main className="px-4 py-8">
      <section
        className="mx-auto w-full max-w-3xl"
        aria-labelledby="verify-blog-title"
      >
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/blogs")}
            className="font-medium text-primary"
          >
            My Blogs
          </Link>
          <span aria-hidden="true"> / </span>
          <Link
            href={localizedPath(locale, `/dashboard/blogs/${blogId}`)}
            className="font-medium text-primary"
          >
            {blog.name}
          </Link>
          <span aria-hidden="true"> / Verify</span>
        </nav>

        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          Blog Management
        </p>
        <h1
          id="verify-blog-title"
          className="mt-1 text-3xl font-semibold text-foreground"
        >
          Ownership verification
        </h1>
        <p className="mt-2 text-sm text-muted">
          Prove you own {blog.url} by completing one of the verification methods
          below.
        </p>

        {actionMessage && (
          <div
            className={`mt-6 rounded-md border px-4 py-3 text-sm ${
              actionMessage.type === "success"
                ? "border-success/30 bg-success/10 text-success"
                : "border-danger/30 bg-danger/10 text-danger"
            }`}
            role="alert"
          >
            {actionMessage.text}
          </div>
        )}

        {isVerified && (
          <div className="mt-6 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            This blog is already verified.
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {VERIFICATION_METHODS.map((method) => {
            const isSelected = selectedMethod === method.key;
            const methodVerification = verifications.find(
              (v) => v.method === method.key
            );
            const methodStatus = methodVerification?.status ?? null;

            return (
              <div
                key={method.key}
                className={`rounded-lg border p-5 ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {method.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {method.description}
                    </p>
                    {methodStatus && (
                      <span
                        className={`mt-2 inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${
                          methodStatus === "verified"
                            ? "border-success/20 bg-success/10 text-success"
                            : methodStatus === "failed"
                              ? "border-danger/20 bg-danger/10 text-danger"
                              : "border-warning/20 bg-warning/10 text-warning"
                        }`}
                      >
                        {methodStatus === "verified"
                          ? "Verified"
                          : methodStatus === "failed"
                            ? "Failed"
                            : methodStatus === "expired"
                              ? "Expired"
                              : "Pending"}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInitiate(method.key)}
                    disabled={isInitiating || isVerified}
                    className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isInitiating && selectedMethod === method.key
                      ? "Starting..."
                      : "Start"}
                  </button>
                </div>

                {isSelected && currentToken && (
                  <div className="mt-5">
                    {selectedMethod === "meta_tag" && (
                      <MetaTagPanel token={currentToken} blogUrl={blog.url} />
                    )}
                    {selectedMethod === "dns_txt" && (
                      <DnsTxtPanel token={currentToken} blogUrl={blog.url} />
                    )}
                    {selectedMethod === "html_file" && (
                      <HtmlFilePanel token={currentToken} blogUrl={blog.url} />
                    )}

                    <button
                      type="button"
                      onClick={handleCheck}
                      disabled={isChecking}
                      className="mt-4 min-h-11 rounded-md border border-primary px-5 text-sm font-semibold text-primary disabled:opacity-50"
                    >
                      {isChecking
                        ? "Checking..."
                        : "Check verification"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {verifications.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Verification history
            </h2>
            <div className="mt-4 grid gap-3">
              {verifications.map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-border bg-surface p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-foreground capitalize">
                        {v.method.replace("_", " ")}
                      </span>
                      <span
                        className={`ml-2 inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${
                          v.status === "verified"
                            ? "border-success/20 bg-success/10 text-success"
                            : v.status === "failed"
                              ? "border-danger/20 bg-danger/10 text-danger"
                              : "border-warning/20 bg-warning/10 text-warning"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <span className="text-muted">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {v.errorMessage && (
                    <p className="mt-2 text-danger">{v.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
