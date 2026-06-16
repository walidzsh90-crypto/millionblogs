"use client";

import { useState, type FormEvent } from "react";

import type { ArticleStatus } from "../api/articles-api";
import { ARTICLE_LANGUAGES } from "../data/article-status";

type BlogOption = { id: string; name: string };
type CategoryOption = { id: string; slug: string; name: string };
type ArticleFiltersValue = {
  search: string;
  status: string;
  language: string;
  blogId: string;
  categorySlug: string;
};

type ArticleFiltersProps = {
  blogs: BlogOption[];
  categories: CategoryOption[];
  value: ArticleFiltersValue;
  onChange: (filters: ArticleFiltersValue) => void;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Processing" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export function ArticleFilters({ blogs, categories, value, onChange }: ArticleFiltersProps) {
  const [search, setSearch] = useState(value.search);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onChange({ ...value, search });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 md:grid-cols-5">
      <form onSubmit={handleSubmit} className="flex gap-2 sm:col-span-2 md:col-span-1">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles..."
          className="min-h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted"
          aria-label="Search articles"
        />
        <button
          type="submit"
          className="min-h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value })}
        className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {blogs.length > 0 && (
        <select
          value={value.blogId}
          onChange={(e) => onChange({ ...value, blogId: e.target.value })}
          className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          aria-label="Filter by blog"
        >
          <option value="">All blogs</option>
          {blogs.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={value.language}
        onChange={(e) => onChange({ ...value, language: e.target.value })}
        className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        aria-label="Filter by language"
      >
        <option value="">All languages</option>
        {ARTICLE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>

      {categories.length > 0 && (
        <select
          value={value.categorySlug}
          onChange={(e) => onChange({ ...value, categorySlug: e.target.value })}
          className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
