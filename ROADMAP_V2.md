# MillionBlogs — Roadmap v2

**Status:** Post-Freeze Architectural Investments

---

## 1. Transactional Outbox Pattern

### Problem
Events are published in-process via `EventEmitter2` with `ignoreErrors: true`. A crash between DB commit and `eventPublisher.publish()` loses the event permanently. For critical events (payment completed, seat claimed, password reset), this creates inconsistent state.

### Solution
Implement a transactional outbox table:

```prisma
model OutboxMessage {
  id          String   @id @default(uuid()) @db.Uuid
  aggregateId String   @map("aggregate_id") @db.Uuid
  aggregateType String @map("aggregate_type") @db.VarChar(50)
  eventName   String   @map("event_name") @db.VarChar(100)
  payload     Json     @db.JsonB
  occurredAt  DateTime @map("occurred_at") @db.Timestamptz
  processedAt DateTime? @map("processed_at") @db.Timestamptz
  error       String?  @db.Text
  retryCount  Int      @default(0) @map("retry_count")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([processedAt, createdAt])
  @@index([eventName])
  @@map("outbox_messages")
}
```

Integration pattern:
```typescript
// In any service that needs guaranteed delivery:
async performCriticalOp(dto: CreateDto) {
  return this.prisma.$transaction(async (tx) => {
    const entity = await tx.entity.create({ data: dto });
    await tx.outboxMessage.create({
      data: {
        aggregateId: entity.id,
        aggregateType: 'entity',
        eventName: EventName.ENTITY_CREATED,
        payload: { ... },
        occurredAt: new Date(),
      },
    });
    return entity;
  });
}
```

A separate `OutboxProcessor` (Bull queue worker) polls `processedAt IS NULL` messages, publishes them to the event bus, and marks them processed. Retry with exponential backoff and dead-letter after 3 failures.

### Migration
1. Add `OutboxMessage` to Prisma schema (`prisma/schema.prisma`)
2. Create `OutboxModule` with `OutboxService` + `OutboxProcessor`
3. Refactor critical service methods to use the outbox pattern (prioritize: Payments → Founder → Subscriptions → Wallet)
4. Add health check: alert on `COUNT(*) WHERE processedAt IS NULL AND createdAt < NOW() - INTERVAL '5 minutes'`

---

## 2. Event Persistence & Delivery Guarantees

### Problem
Current events are purely in-process with no durability, no retry, and no delivery guarantee. 80+ `publish()` calls exist but most have zero subscribers.

### Solution

#### 2.1 Delivery Contract Table
Document every event's delivery guarantee:

| Event | Subscribers | Guarantee | Strategy |
|-------|-------------|-----------|----------|
| `PAYMENT_COMPLETED` | WalletService, SubscriptionService | **At-least-once** | Outbox + retry |
| `FOUNDER_SEAT_CLAIMED` | BadgesService | **At-least-once** | Outbox + retry |
| `SUBSCRIPTION_CREATED` | FeatureAccessService (invalidation) | **At-most-once** | In-process |
| `WALLET_CREDITED` | None (audit-only) | **Best-effort** | Fire-and-forget |
| `PASSWORD_RESET_REQUESTED` | None | **Best-effort** | Fire-and-forget |
| `CAMPAIGN_ACTIVATED` | RotationEngine | **At-most-once** | In-process |

#### 2.2 Event Schema Versioning
Add `eventVersion: number` to every event payload. Bump when structure changes. Subscribers check version before processing.

#### 2.3 Remove Sensitive Data from Events
- `PASSWORD_RESET_REQUESTED` currently includes raw `token` in payload — remove it. Include only `userId` and `email`.
- Audit events should never include secrets, passwords, or tokens.

#### 2.4 Event Log / Replay
Build an `EventLogService` that:
- Records all published events (even fire-and-forget) to a log table
- Provides admin replay capability for outbox events
- Exposes query: `GET /api/admin/events?aggregateId=X`

---

## 3. FeatureAccess Cache

### Problem
`FeatureAccessService.resolve()` queries 3 tables (founder_seats, user_subscriptions, plans) on every invocation. High-frequency endpoints (article list, search results, rotation) pay this cost per-request.

### Solution

#### 3.1 In-Memory Cache with TTL
```typescript
@Injectable()
export class CachedFeatureAccessService {
  private cache = new Map<string, { result: FeatureAccess; expiresAt: number }>();
  private readonly TTL_MS = 60_000; // 60 seconds

  async resolve(userId: string): Promise<FeatureAccess> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    const result = await this.inner.resolve(userId);
    this.cache.set(userId, { result, expiresAt: Date.now() + this.TTL_MS });
    return result;
  }

  invalidate(userId: string) {
    this.cache.delete(userId);
  }
}
```

#### 3.2 Invalidation Hooks
Call `invalidate()` when:
- Founder seat claimed/upgraded
- Subscription created/activated/cancelled/expired
- Plan changed (admin operation)

#### 3.3 Fallback Strategy
On cache miss + DB failure, return the previous cached value (stale) rather than throwing. Log the error.

---

## 4. Cursor Pagination

### Problem
All list endpoints use `OFFSET` / `LIMIT` pagination. At 100K+ rows, `OFFSET` skips rows by scanning — O(N) per page. Also, `OFFSET` is unstable when rows are inserted/deleted between page fetches.

### Solution

#### 4.1 Add `cursor` + `take` Parameters
Modify the base pagination DTO:
```typescript
export class PaginatedQueryDto {
  cursor?: string; // Base64-encoded `id:createdAt`
  take?: number; // Default 20, max 100
}
```

#### 4.2 Convert High-Volume Endpoints First
Priority order:
1. `GET /api/articles` (public article list)
2. `GET /api/admin/articles` (admin article list)
3. `GET /api/account/notifications`
4. `GET /api/admin/transactions`
5. `GET /api/search` (search results)

Cursor query pattern (example for articles):
```sql
SELECT * FROM articles
WHERE (created_at, id) < ($cursorCreatedAt, $cursorId)
ORDER BY created_at DESC, id DESC
LIMIT $take
```

#### 4.3 Base Repository Abstraction
Create a `PaginatedRepository` base class:
```typescript
export abstract class PaginatedRepository<T> {
  protected abstract model: PrismaModel<T>;

  async findManyWithCursor(params: CursorParams) {
    // ...
  }

  async findManyWithOffset(params: OffsetParams) {
    // ... existing pattern
  }
}
```

---

## 5. Analytics Aggregation Layer

### Problem
Analytics data is collected via individual writes per-event:
- `Impression.record()` → one INSERT per impression
- `Click.record()` → one INSERT per click
- `SearchAnalytics.record()` → one INSERT per search
- View count → one UPDATE per article view

At scale, these individual writes create a write bottleneck.

### Solution

#### 5.1 Buffered Analytics Aggregation
Use in-memory buffers that flush periodically:

```typescript
@Injectable()
export class AnalyticsBufferService {
  private buffers = {
    impressions: new Map<string, number>(),
    clicks: new Map<string, number>(),
    searches: new Map<string, number>(),
  };
  private flushInterval: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {
    this.flushInterval = setInterval(() => this.flush(), 10_000); // every 10s
  }

  recordImpression(campaignId: string) {
    const key = campaignId;
    this.buffers.impressions.set(key, (this.buffers.impressions.get(key) || 0) + 1);
  }

  private async flush() {
    for (const [campaignId, count] of this.buffers.impressions) {
      await this.prisma.promotionAnalytics.updateMany({
        where: { campaignId },
        data: { impressions: { increment: count } },
      });
    }
    this.buffers.impressions.clear();
    // Same for clicks, searches, etc.
  }

  onModuleDestroy() {
    clearInterval(this.flushInterval);
    await this.flush(); // flush remaining on shutdown
  }
}
```

#### 5.2 Materialized View for Dashboard
Create a materialized view that aggregates daily analytics:
```sql
CREATE MATERIALIZED VIEW daily_campaign_stats AS
SELECT
  campaign_id,
  DATE(created_at) as day,
  COUNT(*) FILTER (WHERE type = 'impression') as impressions,
  COUNT(*) FILTER (WHERE type = 'click') as clicks
FROM promotion_analytics
GROUP BY campaign_id, DATE(created_at);
```
Refresh periodically via a Bull job (every 5 minutes).

#### 5.3 View Count Optimization
Replace per-request `UPDATE articles SET views = views + 1` with:
- Batch increment in a buffer (similar to impressions)
- Or use PostgreSQL `pg_stat_statements` / Redis for atomic increments

---

## 6. Feed Processing Optimizations

### Problem
The RSS feed scheduler processes feeds sequentially or with limited concurrency. Each sync involves:
1. HTTP fetch (slow, network-bound)
2. Parse + validate (CPU-bound)
3. Dedup checks (DB queries)
4. Entry persistence (DB writes)

### Solution

#### 6.1 Configurable Concurrency
Replace the single-queue scheduler with a priority + concurrency model:

```typescript
// Queue configuration
const FEED_QUEUE = {
  high: { concurrency: 5, interval: '5m' },   // Recently active feeds
  normal: { concurrency: 3, interval: '15m' }, // Standard feeds
  low: { concurrency: 1, interval: '60m' },    // Inactive/new feeds
};
```

#### 6.2 Incremental Sync via ETag / If-Modified-Since
Most RSS feeds support HTTP caching headers. Store `etag` and `lastModified` on `RssFeed`:
- On fetch, send `If-None-Match` / `If-Modified-Since`
- If server returns 304 (Not Modified), skip parsing entirely

#### 6.3 Batch Dedup
Instead of one dedup query per entry, batch all new GUIDs from a sync:
```typescript
const existing = await this.prisma.rssFeedEntry.findMany({
  where: {
    feedId,
    guid: { in: newGuids },
  },
  select: { guid: true },
});
const existingSet = new Set(existing.map(e => e.guid));
const newEntries = entries.filter(e => !existingSet.has(e.guid));
```

#### 6.4 Feed Health Scoring Upgrade
Extend the health score to auto-disable feeds after repeated failures:

| Consecutive Failures | Action |
|---------------------|--------|
| 3 | Decrease priority to `low` |
| 10 | Skip feed for 24h |
| 30 | Auto-disable feed, notify admin |
| 50 | Archive feed (soft-delete) |

---

## Implementation Priority

| # | Item | Effort | Impact | Dependencies |
|---|------|--------|--------|:-----------:|
| 1 | Outbox pattern + `OutboxMessage` table | Medium | Critical (data integrity) | Prisma migration |
| 2 | Event persistence + delivery contracts | Medium | High (reliability) | Outbox |
| 3 | FeatureAccess cache | Low | High (perf) | None |
| 4 | Cursor pagination (top 2 endpoints) | Medium | Medium (perf at scale) | Base repository |
| 5 | Analytics buffer layer | Low | Medium (write perf) | None |
| 6 | Feed concurrency + incremental sync | Medium | Medium (feed perf) | None |

**Total estimated effort: 4–6 weeks for a single developer.**

---

## Risk & Rollback

| Change | Risk | Rollback |
|--------|------|----------|
| Outbox pattern | Duplicate event processing if processor crashes after publish but before marking processed | Use idempotency keys on all outbox event subscribers |
| FeatureAccess cache | Stale permissions served for up to TTL seconds | Set TTL to 10s initially; monitor cache hit ratio |
| Cursor pagination | Frontend expects offset-based pagination | Keep parallel offset-based endpoints during migration |
| Analytics buffer | In-flight buffer lost on crash | Add `onModuleDestroy()` flush; accept minor data loss |
| Feed concurrency | Too many concurrent fetches overwhelm servers | Start conservative (2 high, 1 normal, 1 low) and tune |
