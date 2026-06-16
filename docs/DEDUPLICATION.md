# Article Deduplication

## Scope

Article deduplication operates across:
- **All blogs** — prevents the same article appearing on multiple blogs
- **All feeds** — prevents duplicate imports from different RSS feeds
- **All languages** — prevents re-imports even if language tag differs

## Detection Order

Each incoming article is checked against 4 fields in sequence:

### 1. Canonical URL

The article's `<link>` or canonical URL is checked first.

**Coverage**: Global across all articles.

### 2. Normalized URL

URLs are normalized before comparison:
- Protocol → lowercase
- Hostname → lowercase
- Trailing slash → removed
- Hash fragment → removed
- Query string → removed

**Coverage**: Global across all articles.

### 3. URL Hash

A SHA-256 hash of the normalized URL is stored in `urlHash`.

**Coverage**: Global across all articles. The `urlHash` field is indexed.

### 4. Feed Entry GUID

If the article originates from an RSS discovery, the `feedEntryId` is checked.

**Coverage**: Only matches articles from the same RSS entry.

## Database-Level Protection

```prisma
model Article {
  canonicalUrl  String  @map("canonical_url") @db.VarChar(2048)
  normalizedUrl String  @map("normalized_url") @db.VarChar(2048)
  urlHash       String  @map("url_hash") @db.VarChar(64)

  @@index([canonicalUrl])
  @@index([urlHash])
}
```

## Pipeline Integration

When a duplicate is detected during pipeline processing:
1. The pipeline returns `deduplicationResult: "duplicate_canonical_url"` (or the matching field)
2. No new article is created
3. The `ARTICLE_DISCOVERED` event is still emitted for tracking
4. Sync logs track the duplicate count

## Batch Processing

`ArticleDeduplicationService.checkBatch()` processes up to 50 entries concurrently for efficient batch deduplication during full feed syncs.
