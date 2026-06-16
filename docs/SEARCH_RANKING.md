# Search Ranking

## Ranking Factors

Search results are ranked using PostgreSQL `ts_rank` combined with business signals.

### 1. Text Relevance (Primary)

PostgreSQL `ts_rank()` computes relevance based on:

| Weight | Field   | Description          |
|--------|---------|----------------------|
| A      | title   | Highest weight       |
| B      | excerpt | Medium weight        |

### 2. Freshness (Secondary)

Articles with more recent `published_at` dates rank higher.

### 3. Trust Status (Tertiary)

Blog trust status provides a boost multiplier:

| Trust Status | Boost | Description                |
|--------------|-------|----------------------------|
| featured     | 3x    | Editorially featured blogs |
| trusted      | 2x    | Long-standing trusted blogs|
| verified     | 1x    | Standard verified blogs    |
| new          | 0x    | New/unverified blogs       |

### 4. Blog Sorting (Blog Results)

Blog search results are ordered by:
1. Trust status (featured → trusted → verified → new)
2. Text relevance
3. Creation date (newer first)

## Combined Ranking (Articles)

```
final_rank = ts_rank(tsv_article, query)
  + trust_status_boost
  + freshness_boost
```

Where:
- `ts_rank` uses `plainto_tsquery('english', query)`
- `trust_status_boost` is applied via `CASE` in SQL `ORDER BY`
- `freshness_boost` is implicit via `published_at DESC` ordering

## No AI Ranking

Ranking uses deterministic PostgreSQL FTS + business rules only. No machine learning, AI, or personalization is used.
