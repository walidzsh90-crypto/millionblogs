# Real Data Integration Phase 2 — Detail Pages & Search

## Overview

Phase 2 completes the migration of all remaining public pages from hardcoded demo data to live API-backed SSR data. These 5 pages were the last ones still using static arrays of fake content:

- **Search** (`/search`)
- **Blog Detail** (`/blogs/[blogSlug]`)
- **Article Detail** (`/articles/[articleId]`)
- **Category Detail** (`/categories/[categorySlug]`)
- **Language Detail** (`/languages/[languageCode]`)

---

## New Data Fetchers

### `shared/api/data.ts` additions

| Fetcher | API Endpoint | Used By |
|---|---|---|
| `fetchSearch(params)` | `GET /api/v1/search?q&language&categorySlug&blogSlug&page&pageSize` | Search |
| `fetchBlogBySlug(slug)` | `GET /api/v1/blogs/:slug` | Blog Detail |
| `fetchArticleById(id)` | `GET /api/v1/articles/:id` | Article Detail |

### `shared/api/types.ts` additions

| Type | Source DTO |
|---|---|
| `SearchResultDto` | `SearchResultDto` (from `/api/v1/search`) |
| `SearchResponseDto` | `SearchResponseDto` (from `/api/v1/search`) |

---

## APIs Used (per page)

### Search (`(public)/search/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Search results | `GET /api/v1/search?q&language&categorySlug&blogSlug&page=12` | Empty state with "Start a search" prompt |
| Filter options (categories, blogs) | `GET /api/v1/blogs?pageSize=100` → extracted | Dropdown shows "All" only |
| Filter options (languages) | `supportedLocales` from `@/i18n/config` | Always available |
| Result count label | `searchData.total` | "N results found" or "Enter a query..." |
| Pagination | From API `page`, `totalPages` | Previous/Next with disabled states |
| SEO metadata | `noIndex: true` (directories are indexed, search is not) | — |

*Search uses `dynamic = "force-dynamic"` since results must be fresh.*

### Blog Detail (`(public)/blogs/[blogSlug]/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Blog profile | `GET /api/v1/blogs/:slug` | Not-found page with search CTA |
| Latest articles | `GET /api/v1/articles?blogId=<id>&pageSize=10` | Empty state "No latest articles yet" |
| Related blogs | `GET /api/v1/blogs?categorySlug=<firstCategory>&pageSize=4` (filtered to exclude self) | Empty state "No related blogs yet" |
| Blog initials | First letter of each word in `blog.name` | Always present |
| Verification label | Derived from `trustStatus` + `verifiedAt` | "Unverified" fallback |
| Badges | Mapped from `trustStatus` ("featured" → "Featured", "verified" → "Verified") | Empty badges array |
| Categories | `blog.categories` → links to category detail pages | Empty state |
| JSON-LD | Blog schema.org metadata | — |

### Article Detail (`(public)/articles/[articleId]/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Article metadata | `GET /api/v1/articles/:id` | Not-found page with search CTA |
| Related articles | `GET /api/v1/articles?blogId=<id>&pageSize=4` (filtered to exclude self) | Empty state "No related articles yet" |
| Category name | `article.categories[0]?.name` | Hidden if no categories |
| Blog sidebar | `article.blog` (name, slug) from API | Hidden if no blog association |
| "Continue reading" link | `article.canonicalUrl` | Hidden if missing |
| Formatted date | `Intl.DateTimeFormat` with locale | Empty string if no date |
| JSON-LD | Article schema.org with blog reference | — |

### Category Detail (`(public)/categories/[categorySlug]/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Blog list | `GET /api/v1/blogs?categorySlug=<slug>&pageSize=50` | Empty state |
| Article list | `GET /api/v1/articles?categorySlug=<slug>&page=<n>&pageSize=4` | Empty state |
| Category name | Derived from slug via `slugToName()` (e.g. "technology" → "Technology") | Always present |
| Blog initials | First letter of each word in `blog.name` | Always present |
| Pagination | From articles API `page`, `totalPages` | Previous/Next with disabled states |
| JSON-LD | CollectionPage schema.org | — |
| Not-found handling | If both blogs and articles return empty, shows "Category not found" with search CTA | — |

### Language Detail (`(public)/languages/[languageCode]/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Blog list | `GET /api/v1/blogs?language=<code>&pageSize=50` | Empty state |
| Article list | `GET /api/v1/articles?language=<code>&page=<n>&pageSize=4` | Empty state |
| Language name/nativeName | Static map (27 languages) — no API endpoint exists for language metadata | "Not found" if code unrecognized |
| Popular categories | Extracted from blogs + articles in this language, sorted by count | Section hidden if none |
| RTL direction | `getDirection(code)` for Arabic (`ar`) | LTR default |
| Pagination | From articles API `page`, `totalPages` | Previous/Next with disabled states |
| JSON-LD | CollectionPage schema.org | — |
| Not-found handling | If language code not in map, shows "Language page not found" with search CTA | — |

---

## Data Flow

### SSR fetch chain (all pages use the same pattern):

```
Page Component (async server component)
  │
  ├─► Parallel fetch via Promise.all
  │     ├─► fetchBlogBySlug(slug)     → GET /api/v1/blogs/:slug
  │     └─► fetchArticles({ blogId })  → GET /api/v1/articles?blogId=&pageSize=
  │
  ├─► Check for null/empty → render fallback UI
  │
  └─► Render real data via same JSX structure (no layout changes)
```

### Search page has additional complexity:

- Search form submits via GET with `q`, `language`, `category`, `blog` params
- Form values use slugs (not names) for the filter dropdowns
- `fetchBlogs({ pageSize: 100 })` runs in parallel to populate filter options
- Categories extracted from blog data for the category dropdown
- Blog slugs are used directly as dropdown values

---

## Revalidation Strategy

| Page | `revalidate` | Rationale |
|---|---|---|
| Blog Detail | 900s (15 min) | Blog metadata rarely changes |
| Article Detail | 900s (15 min) | Article metadata is static after import |
| Category Detail | 900s (15 min) | Blog/article additions within 15 min is acceptable |
| Language Detail | 900s (15 min) | Same as category detail |
| Search | `force-dynamic` | Search results must be fresh per user query |

---

## Graceful Degradation Examples

### Blog not found (`GET /api/v1/blogs/:slug` returns 404):
- `ssrFetch` returns `null`
- Page renders "Blog profile not found" with link to search
- JSON-LD skipped

### API server is down:
- `ssrFetch` returns `null` for all calls
- Blog detail shows not-found state (which implies the blog could not be loaded)
- Article detail shows not-found state
- Category/language detail shows "not found" if no cached data exists
- Search shows "Start a search" prompt with empty filter dropdowns

### Article has no blog association:
- `article.blog` is `null`
- Blog sidebar is hidden
- Related articles fall back to an empty list
- "Continue reading" button still works via `canonicalUrl`

---

## Files Changed

| File | Change |
|---|---|
| `shared/api/types.ts` | **Updated** — added `SearchResultDto`, `SearchResponseDto` |
| `shared/api/data.ts` | **Updated** — added `fetchSearch()`, `fetchBlogBySlug()`, `fetchArticleById()` |
| `(public)/search/page.tsx` | **Rewritten** — removed 4 hardcoded arrays + client-side filtering; replaced with `GET /api/v1/search` + `GET /api/v1/blogs` for filter options |
| `(public)/blogs/[blogSlug]/page.tsx` | **Rewritten** — removed 3 hardcoded blog profiles; replaced with `GET /api/v1/blogs/:slug` + `GET /api/v1/articles?blogId=` |
| `(public)/articles/[articleId]/page.tsx` | **Rewritten** — removed 4 hardcoded articles; replaced with `GET /api/v1/articles/:id` + related articles from same blog |
| `(public)/categories/[categorySlug]/page.tsx` | **Rewritten** — removed 3 hardcoded category profiles; replaced with `GET /api/v1/blogs?categorySlug=` + `GET /api/v1/articles?categorySlug=` |
| `(public)/languages/[languageCode]/page.tsx` | **Rewritten** — removed 3 hardcoded language profiles; replaced with `GET /api/v1/blogs?language=` + `GET /api/v1/articles?language=` |

## Zero Hardcoded Content — Complete

| Page | Previously hardcoded items | Now powered by |
|---|---|---|
| Homepage | 3 featured blogs, 3 articles, 3 trending, 8 categories, 3 languages | 3 API calls + 2 extractors |
| Blogs (list) | 6 blog entries | `GET /api/v1/blogs` |
| Blog Detail | 3 blog profiles with articles, badges, related | `GET /api/v1/blogs/:slug` + `GET /api/v1/articles` |
| Articles (list) | 8 article entries | `GET /api/v1/articles` |
| Article Detail | 4 article entries with blog info, related | `GET /api/v1/articles/:id` + related from same blog |
| Categories (list) | 11 category entries | Extraction from `GET /api/v1/blogs` |
| Category Detail | 3 category profiles with blogs & articles | `GET /api/v1/blogs?categorySlug=` + `GET /api/v1/articles?categorySlug=` |
| Languages (list) | 3 language entries | Extraction from `GET /api/v1/blogs` + `GET /api/v1/articles` |
| Language Detail | 3 language profiles with blogs, articles, categories | `GET /api/v1/blogs?language=` + `GET /api/v1/articles?language=` |
| Search | 4 articles + 4 blogs + client-side filtering | `GET /api/v1/search` + `GET /api/v1/blogs` for filter options |
| Pricing | 3 plan entries, founder tiers, credit packs | `GET /api/v1/plans`; static (founder/credits) |
| Support | 7 FAQ items | Static (no API dependency by design) |

**Every public page now sources its primary content from real API calls.**
