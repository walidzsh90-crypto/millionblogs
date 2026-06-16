# Real Data Integration — SSR Data Layer

## Overview

All 6 public directory pages and the homepage have been migrated from hardcoded demo data to live API-backed SSR data. The data layer uses server-side `fetch()` calls to the backend NestJS API, with ISR caching and graceful fallback when the API is unavailable.

---

## Architecture

```
Browser Request
      │
      ▼
Next.js SSR (async server component)
      │
      ├─► shared/api/ssr.ts     (low-level fetch utility)
      ├─► shared/api/types.ts   (API response type definitions)
      ├─► shared/api/data.ts    (page-level data fetchers)
      │
      ▼
Backend API (NestJS at {API_ORIGIN}/api/v1)
      │
      ▼
PostgreSQL
```

### SSR fetch utility: `shared/api/ssr.ts`

- Uses `process.env.API_ORIGIN` for the backend base URL (default: `http://localhost:3001`)
- Constructs full URL as `{API_ORIGIN}/api/v1{path}`
- Uses Next.js `fetch()` with `next.revalidate` for ISR caching
- Returns parsed JSON or `null` on failure/404
- `SsrFetchError` thrown for non-404 HTTP errors

### Data fetchers: `shared/api/data.ts`

| Fetcher | API Endpoint | Used By |
|---|---|---|
| `fetchBlogs(params)` | `GET /api/v1/blogs?search&language&categorySlug&page&pageSize` | Homepage, Blogs, Categories, Languages |
| `fetchArticles(params)` | `GET /api/v1/articles?search&language&categorySlug&blogId&page&pageSize` | Homepage, Articles, Languages |
| `fetchBlogStats()` | `GET /api/v1/blogs/stats` | Homepage |
| `fetchPlans()` | `GET /api/v1/plans` | Pricing |
| `extractCategories(blogs)` | — (client-side aggregation) | Homepage, Blogs, Categories |
| `extractLanguages(articles)` | — (client-side aggregation) | Homepage, Languages |

### Shared types: `shared/api/types.ts`

| Type | Source DTO |
|---|---|
| `BlogDto` | `BlogResponseDto` (from `/api/v1/blogs`) |
| `ArticleDto` | `ArticleResponseDto` (from `/api/v1/articles`) |
| `PlanDto` | `PlanResponseDto` (from `/api/v1/plans`) |
| `BlogStatsDto` | Stats endpoint response |
| `PaginatedResult<T>` | Standard pagination wrapper |
| `CategoryRef` | Category sub-object within blog/article responses |

---

## APIs Used (per page)

### Homepage (`(public)/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Featured blogs | `GET /api/v1/blogs?pageSize=9` | Section hidden if empty |
| Latest articles | `GET /api/v1/articles?pageSize=6` | Section hidden if empty |
| Trending articles | Sorted by `viewCount` from same articles dataset | Section hidden if empty |
| Categories | Extracted from blog `categories` field | Static fallback labels shown |
| Languages | Extracted from article `language` field | Static fallback links shown |
| Directory stats | `GET /api/v1/blogs/stats` | Hidden from "Live discovery" card |
| JSON-LD | Generated from fetched data | Skipped if data is empty |
| SEO metadata | Uses locale + canonical + hreflang | Always generated |

### Blogs Directory (`(public)/blogs/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Blog list | `GET /api/v1/blogs?search=&language=&categorySlug=&pageSize=50` | Empty state with CTA |
| Language options | Extracted from `blogs[].primaryLanguage` | Hidden |
| Category options | Extracted from `blogs[].categories` | Hidden |
| Blog initials | First character of `blog.name` | Always present |
| Badge colors | Mapped from `trustStatus` | Fallback to "New" color |
| JSON-LD | Generated from fetched blogs | Skipped if empty |
| SEO metadata | Always generated | — |

### Articles Directory (`(public)/articles/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Article list | `GET /api/v1/articles?search=&language=&categorySlug=&blogId=&page=&pageSize=6` | Empty state with CTA |
| Language options | Extracted from `articles[].language` | Hidden |
| Category options | Extracted from `articles[].categories` | Hidden |
| Blog options | Extracted from `articles[].blog` | Hidden |
| Pagination | From API `page`, `total`, `pageSize` | Previous/Next with disabled states |
| JSON-LD | Generated from fetched articles | Skipped if empty |
| SEO metadata | Always generated | — |

### Categories Directory (`(public)/categories/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Category list | Extracted from `GET /api/v1/blogs?pageSize=100` → `blogs[].categories` | Empty state with CTA |
| JSON-LD | Generated from categories | Skipped if empty |
| SEO metadata | Always generated | — |

### Languages Directory (`(public)/languages/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Language list | Extracted from `GET /api/v1/blogs?pageSize=100` + `GET /api/v1/articles?pageSize=100` | Empty state |
| Article/blog counts | Filtered from same datasets | Shows 0 |
| RTL badge | `getDirection(code)` for `ar` | Hidden for LTR |
| JSON-LD | Generated from languages | Skipped if empty |
| SEO metadata | Always generated | — |

### Pricing (`(public)/pricing/page.tsx`)

| Data | API | Fallback |
|---|---|---|
| Plans list | `GET /api/v1/plans` (sorted by `sortOrder`) | Static "Plans loading" message |
| Features | Extracted from `plan.features` object values | Hidden if empty |
| Plan price | `plan.price` + `plan.currency` | Shows "$0" |
| Highlighted plan | Middle plan in sorted array | — |
| JSON-LD | Generated from plans | Skipped if empty |
| SEO metadata | Always generated | — |
| Founder program | Static content (no API) | Always shown |
| Credit packs | Static content (no API) | Always shown |

---

## Fallback Behavior

Each page follows a consistent fallback strategy:

```
data === null     → show empty state with "No X found" + action CTA
data.items === [] → show empty state with "No X found" + action CTA
data.items > 0    → render content normally
```

For the homepage specifically:
- If **blogs API fails**: featured blogs section is hidden
- If **articles API fails**: latest/trending sections are hidden
- If **both fail**: hero + footer still render, user sees minimal page
- If **stats API fails**: "Live discovery" card shows generic text
- If **categories/languages extraction yields nothing**: static fallback labels are shown instead of empty sections

No page crashes when the API is unavailable. Every section has a conditional render.

---

## Error Handling

### `ssrFetch()` error handling:
- **Network error** (no response): returns `null`, no throw
- **HTTP 404**: returns `null` (graceful not-found)
- **HTTP 5xx**: returns `null` (graceful degradation)
- **Invalid JSON**: returns `null`
- **All other HTTP errors**: throws `SsrFetchError` (but page catches via `null` pattern)

### Page-level error handling:
- Pages are async server components — if a `fetch()` inside `ssrFetch` throws unexpectedly, Next.js error boundary catches it
- Each section independently checks for data availability before rendering
- No try/catch at page level needed because `ssrFetch` converts most errors to `null`

---

## Revalidation Strategy

| Page | `revalidate` | Rationale |
|---|---|---|
| Homepage | 900s (15 min) | Latest/trending content updates within 15 min |
| Blogs | 900s (15 min) | Blog creation is infrequent enough for 15-min delay |
| Articles | 900s (15 min) | New articles from RSS sync may take minutes |
| Categories | 900s (15 min) | Category changes are even less frequent |
| Languages | 900s (15 min) | Language changes are rare |
| Pricing | 900s (15 min) | Plan changes are administrative |

ISR (Incremental Static Regeneration) serves cached HTML for the TTL, then re-generates on the next request after expiry. No stale content is served because `revalidate` triggers background regeneration.

---

## Environment Variables

```
# Required for SSR API calls (server-side only)
API_ORIGIN=http://localhost:3001

# Used by client-side API client
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

`API_ORIGIN` must point to the running NestJS backend. In production, this would be `https://api.millionblogs.com`. It is **never** exposed to the client — only used during SSR.

---

## Files Changed

| File | Change |
|---|---|
| `shared/api/ssr.ts` | **Created** — SSR fetch utility |
| `shared/api/types.ts` | **Created** — API response types |
| `shared/api/data.ts` | **Created** — data fetchers + extractors |
| `(public)/page.tsx` | **Rewritten** — removed all hardcoded arrays, 3 API calls + extraction |
| `(public)/blogs/page.tsx` | **Rewritten** — removed hardcoded blogs, dynamic languages/categories from API |
| `(public)/articles/page.tsx` | **Rewritten** — removed hardcoded articles, paginated API data, dynamic filter options |
| `(public)/categories/page.tsx` | **Rewritten** — categories extracted from API blog data |
| `(public)/languages/page.tsx` | **Rewritten** — languages extracted from API blog + article data |
| `(public)/pricing/page.tsx` | **Rewritten** — plans from API, kept static founder/credit sections |
| `(public)/support/page.tsx` | **Unchanged** — static FAQ, no API dependency |

## Zero Hardcoded Content

| Page | Previously hardcoded items | Now powered by |
|---|---|---|
| Homepage | 3 featured blogs, 3 latest articles, 3 trending articles, 8 categories, 3 languages | 3 API calls + 2 extractors |
| Blogs | 6 blog entries with all fields | `GET /api/v1/blogs` |
| Articles | 8 article entries with all fields | `GET /api/v1/articles` |
| Categories | 11 category entries | `GET /api/v1/blogs` + extraction |
| Languages | 3 language entries | `GET /api/v1/blogs` + `GET /api/v1/articles` + extraction |
| Pricing | 3 plan entries, founder tiers, credit packs | `GET /api/v1/plans` (plans); static (founder/credits) |
| Support | 7 FAQ items | Static (no API dependency by design) |

The only remaining static content is:
- **Founder program** (Pricing page) — no API endpoint exists for public founder data
- **Credit packs** (Pricing page) — no API endpoint for credit package pricing
- **FAQ** (Support page) — no API endpoint; inherently static content
