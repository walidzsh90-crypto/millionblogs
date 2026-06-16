# Feed Health

## Health Score

Each feed has a health score from 0-100, calculated by `FeedHealthService`.

### Scoring Factors

| Factor           | Weight | Description                                  |
|------------------|--------|----------------------------------------------|
| Success Ratio    | 60%    | Ratio of successful syncs to total syncs     |
| Failure Count    | 30%    | -5 per failure (max -30)                     |
| Response Time    | 20%    | Penalty for slow responses                    |
| Error Count      | 10%    | -2 per consecutive error (max -15)           |

### Calculation

```
score = 100
if totalOps > 0:
    score = 100 * (0.4 + 0.6 * successRatio)
score -= min(failures * 5, 30)
if avgResponseTime > 10000ms: score -= 20
else if > 5000ms: score -= 10
else if > 2000ms: score -= 5
score -= min(errorCount * 2, 15)
score = max(0, round(score))
```

## Health Labels

| Score Range | Label      |
|-------------|------------|
| 90-100      | Excellent  |
| 70-89       | Good       |
| 50-69       | Fair       |
| 25-49       | Poor       |
| 0-24        | Critical   |

## Auto-Failure

After 10 consecutive failures, the feed status automatically changes to `failed`.

## Retry & Dead Letter

- Failed syncs are moved to the **Retry Queue** (exponential backoff: 1min, 2min, 4min, ..., max 24h)
- After 5 retry attempts, the feed moves to the **Dead Letter Queue (DLQ)**
- Feeds in the DLQ require manual admin intervention

## Exposed Endpoints

```
GET  /api/feeds/:id/health     - Feed health details
GET  /api/feeds/:id/logs       - Sync log history
GET  /api/feeds/:id/entries    - Imported entries
GET  /api/feeds/stats          - Aggregate feed stats
GET  /api/feeds/scheduler      - Queue status
```
