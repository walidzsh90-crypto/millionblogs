# RSS Sync

## Sync Flow

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│Scheduler │───>│ Fetch Feed   │───>│ Validate XML │
│Trigger   │    │ (HTTP GET)   │    │ (RSS/Atom)   │
└──────────┘    └──────────────┘    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │ Parse Feed   │
                                    │ (RSS/Atom)   │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │ Deduplicate  │
                                    │ Check        │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │ Store Entries│
                                    │ (if new)     │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │ Update Health │
                                    │ Score + Logs │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │ Emit Events  │
                                    └──────────────┘
```

## Manual Sync

A feed can be manually synced via:

```
POST /api/feeds/:id/sync
```

This pushes the feed to the front of the priority queue with maximum priority.

## Auto Sync

The `FeedSchedulerService` runs on an interval (default 60s). Each cycle:

1. Processes retry queue (moves ready items back to priority queue)
2. Dequeues up to 5 items from priority queue
3. Syncs each dequeued feed
4. Updates next sync time based on `syncFrequency`

## Sync Frequencies

Configured per-feed via `syncFrequency` (in seconds):

| Label          | Seconds |
|----------------|---------|
| 15 Minutes     | 900     |
| 1 Hour         | 3600    |
| 6 Hours        | 21600   |
| 12 Hours       | 43200   |
| 24 Hours       | 86400   |

These are not hardcoded - any value >= 60 seconds is accepted.

## Priority Queue

- Feed priority (0-10, default 0)
- Higher priority items sync first
- Manual syncs get priority 10
- Retries get decreasing priority
