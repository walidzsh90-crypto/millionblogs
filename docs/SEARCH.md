# Search Module

## Overview

The Search module provides full-text search across published MillionBlogs content using PostgreSQL's built-in Full Text Search (FTS) capabilities. No external search engines (Elasticsearch, Algolia, Meilisearch, etc.) are used.

## Architecture

```
User Query
    │
    ▼
┌──────────────┐
│ SearchQueryDto│  q, language, categorySlug, blogSlug, dateFrom, dateTo, sort, page, pageSize
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ SearchService │  Orchestrates article + blog search, merges results, tracks analytics
└──────┬───────┘
       │
       ├─────────────────┐
       ▼                  ▼
┌──────────────┐  ┌──────────────┐
│SearchRepo     │  │SearchRepo    │
│(articles)     │  │(blogs)       │
└──────┬───────┘  └──────┬───────┘
       │                  │
       └──────┬───────────┘
              ▼
┌──────────────────────┐
│ PostgreSQL FTS       │
│ tsvector + GIN index │
└──────────────────────┘
```

## Search Sources

| Source     | Status Filter          | Exclusion                     |
|------------|------------------------|-------------------------------|
| Articles   | `status = 'published'` | draft, processing, rejected, archived |
| Blogs      | `status IN ('verified', 'public')` | draft, suspended, archived |

### Never Searched

- RSS Feed Entries
- Draft Articles
- Archived Articles
- Suspended Blogs

## Search Features

- **Keyword Search** — Full-text search across titles (weight A) and excerpts (weight B)
- **Language Filtering** — Filter by language code
- **Category Filtering** — Filter by category slug
- **Blog Filtering** — Filter by blog slug
- **Date Filtering** — Date range (`dateFrom`, `dateTo`)
- **Sorting** — By relevance (default), date, or title
- **Pagination** — Configurable page size (max 100)

## API

```
GET /api/search?q=keyword
GET /api/search/articles?q=keyword
GET /api/search/blogs?q=keyword
```

## Ranking

See [SEARCH_RANKING.md](./SEARCH_RANKING.md).

## Analytics

Search queries are tracked anonymously (no personal profiling) for:
- Popular queries
- Search volume trends
- Language distribution
- Response times
