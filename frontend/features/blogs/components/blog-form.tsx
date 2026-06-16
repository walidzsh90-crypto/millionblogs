"use client";

import { useState, type FormEvent } from "react";

import type { BlogResponse, CreateBlogInput, UpdateBlogInput, Category } from "../api/blogs-api";
import { LANGUAGES } from "../data/languages";

type BlogFormProps = {
  mode: "create" | "edit";
  blog?: BlogResponse;
  categories: Category[];
  onSubmit: (data: CreateBlogInput | UpdateBlogInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function BlogForm({
  mode,
  blog,
  categories,
  onSubmit,
  onCancel,
  isSubmitting,
}: BlogFormProps) {
  const [name, setName] = useState(blog?.name ?? "");
  const [url, setUrl] = useState(blog?.url ?? "");
  const [description, setDescription] = useState(blog?.description ?? "");
  const [primaryLanguage, setPrimaryLanguage] = useState(
    blog?.primaryLanguage ?? "en"
  );
  const [visibility, setVisibility] = useState(blog?.visibility ?? "public");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    blog?.categories.map((c) => c.id) ?? []
  );
  const [selectedAdditionalLanguages, setSelectedAdditionalLanguages] = useState<
    string[]
  >(blog?.additionalLanguages ?? []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Blog name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Blog name must be at least 2 characters";
    }

    if (!url.trim()) {
      newErrors.url = "Website URL is required";
    } else if (!/^https?:\/\/.+/i.test(url.trim())) {
      newErrors.url = "URL must start with http:// or https://";
    }

    if (!primaryLanguage) {
      newErrors.primaryLanguage = "Primary language is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    try {
      const payload: any = {
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        primaryLanguage,
        categoryIds:
          selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        additionalLanguages:
          selectedAdditionalLanguages.length > 0
            ? selectedAdditionalLanguages
            : undefined,
      };

      if (mode === "edit") {
        payload.visibility = visibility;
      }

      await onSubmit(payload);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to save blog");
    }
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  function toggleAdditionalLanguage(langCode: string) {
    setSelectedAdditionalLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((l) => l !== langCode)
        : [...prev, langCode]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      {submitError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {submitError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="blog-name" className="text-sm font-semibold text-foreground">
            Blog name <span className="text-danger">*</span>
          </label>
          <input
            id="blog-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`min-h-11 rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted ${errors.name ? "border-danger" : "border-border"}`}
            placeholder="My Blog"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "blog-name-error" : undefined}
          />
          {errors.name && (
            <p id="blog-name-error" className="text-xs text-danger">
              {errors.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="blog-url" className="text-sm font-semibold text-foreground">
            Website URL <span className="text-danger">*</span>
          </label>
          <input
            id="blog-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`min-h-11 rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted ${errors.url ? "border-danger" : "border-border"}`}
            placeholder="https://example.com"
            aria-invalid={!!errors.url}
            aria-describedby={errors.url ? "blog-url-error" : undefined}
          />
          {errors.url && (
            <p id="blog-url-error" className="text-xs text-danger">
              {errors.url}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="blog-description" className="text-sm font-semibold text-foreground">
          Description
        </label>
        <textarea
          id="blog-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted"
          placeholder="A short description of your blog"
          rows={4}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="blog-language"
            className="text-sm font-semibold text-foreground"
          >
            Primary language <span className="text-danger">*</span>
          </label>
          <select
            id="blog-language"
            value={primaryLanguage}
            onChange={(e) => setPrimaryLanguage(e.target.value)}
            className={`min-h-11 rounded-md border bg-background px-3 text-sm text-foreground ${errors.primaryLanguage ? "border-danger" : "border-border"}`}
            aria-invalid={!!errors.primaryLanguage}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.code.toUpperCase()})
              </option>
            ))}
          </select>
          {errors.primaryLanguage && (
            <p className="text-xs text-danger">{errors.primaryLanguage}</p>
          )}
        </div>

        {mode === "edit" && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="blog-visibility"
              className="text-sm font-semibold text-foreground"
            >
              Visibility
            </label>
            <select
              id="blog-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </div>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          Categories
        </legend>
        {categories.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No categories available.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                  aria-pressed={selected}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-foreground">
          Additional languages
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGUAGES.filter((l) => l.code !== primaryLanguage).map((lang) => {
            const selected = selectedAdditionalLanguages.includes(lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => toggleAdditionalLanguage(lang.code)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
                aria-pressed={selected}
              >
                {lang.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-md bg-primary px-6 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create blog"
              : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-11 rounded-md border border-border px-6 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
