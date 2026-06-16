# Article Lifecycle

## States

```
                    ┌──────────┐
                    │  Draft   │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │Processing│
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
         │Published│ │Rejected│ │ Archived  │
         └────┬────┘ └────────┘ └────┬──────┘
              │                      │
              └──────────────────────┘
                    (can archive
                     from published)
```

## Creation

Articles can be created through two paths:

### 1. RSS Pipeline

```
RSS Feed Sync → Feed Validator → Feed Parser → Content Pipeline → Article
```

The pipeline automatically validates, normalizes, deduplicates, detects language, categorizes, and publishes the article.

### 2. Manual Creation

```
User → API → CreateArticleDto → Validation → Normalization → Article
```

Manual articles skip deduplication (checked) and are immediately published.

## Updates

Articles can be updated via `PATCH /user/articles/:id` (authenticated) or `PATCH /admin/articles/:id` (admin).

Updatable fields:
- Title
- Excerpt
- Featured Image URL
- Author
- Language
- Status
- Categories

## Status Transitions

| From        | To          | Trigger                          |
|-------------|-------------|----------------------------------|
| Draft       | Published   | Manual publish                   |
| Processing  | Published   | Pipeline completion              |
| Processing  | Rejected    | Pipeline validation failure      |
| Published   | Archived    | User delete or admin archive     |
| Published   | Rejected    | Admin rejection                  |
| Rejected    | Draft       | Admin reset                      |
| Archived    | Draft       | Admin restore                    |

## Metrics

Each article tracks:
- **viewCount** — Incremented on public view via `GET /articles/:blogSlug/:articleSlug`
- **clickCount** — Incremented via `POST /user/articles/:id/click`
- **CTR** — Calculated as `clickCount / viewCount`

## Deletion

Articles are soft-deleted:
- `deletedAt` timestamp set
- `status` changed to `archived`
- Record remains in database for recovery
- Admin can restore by clearing `deletedAt`

## Events

| Event               | When                           |
|---------------------|--------------------------------|
| ARTICLE_CREATED     | Record created (any source)    |
| ARTICLE_PUBLISHED   | Status changed to published    |
| ARTICLE_REJECTED    | Status changed to rejected     |
| ARTICLE_ARCHIVED    | Status changed to archived     |
| ARTICLE_UPDATED     | Any field modified             |
