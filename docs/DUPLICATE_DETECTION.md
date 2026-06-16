# Duplicate Detection

## Detection Strategy

Each imported entry is checked against 4 fields to prevent duplicates:

### 1. GUID Check

The entry's `<guid>` (RSS) or `<id>` (Atom) is checked within the same feed.

**Priority**: Highest. Most feeds include stable, unique GUIDs.

### 2. Canonical URL Check

The entry's `<link>` URL is checked.

**Scope**: Same feed.

### 3. Normalized URL Check

URLs are normalized before comparison:
- Protocol lowered
- Hostname lowered
- Trailing slash removed
- Hash fragment removed

**Scope**: Same feed.

### 4. URL Hash Check

A SHA-256 hash of the normalized URL is stored and checked.

**Scope**: Same feed.

## Detection Order

1. GUID match → duplicate
2. Canonical URL match → duplicate
3. Normalized URL match → duplicate
4. URL hash match → duplicate
5. No match → new entry

## Storage

```prisma
model RssFeedEntry {
  guid          String   @db.VarChar(255)
  canonicalUrl  String?  @map("canonical_url") @db.VarChar(2048)
  normalizedUrl String?  @map("normalized_url") @db.VarChar(2048)
  urlHash       String   @map("url_hash") @db.VarChar(64)

  @@unique([feedId, guid])
  @@unique([feedId, urlHash])
}
```

Both `(feedId, guid)` and `(feedId, urlHash)` are unique constraints, providing database-level duplicate prevention.

## Counters

Each sync log tracks:
- `importedCount` - New entries created
- `skippedCount` - Entries skipped due to errors
- `duplicateCount` - Entries that matched existing records
