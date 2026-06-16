# RSS Engine

## Overview

The RSS Engine is the content discovery subsystem for MillionBlogs. It is fully isolated from Articles, Search, Promotions, Wallet, and Payments. Its sole responsibility is discovering and importing content from external RSS/Atom feeds.

## Architecture

```
┌─────────────────────────────────────────────┐
│                 RSS Module                   │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │Validation│  │ Parsing  │  │Scheduler  │  │
│  │  Layer   │  │  Layer   │  │  Layer    │  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  │
│       │            │              │         │
│  ┌────▼────────────▼──────────────▼─────┐  │
│  │           Feeds Service              │  │
│  │    (Core orchestration logic)        │  │
│  └────────────────┬─────────────────────┘  │
│                   │                        │
│  ┌────────────────▼─────────────────────┐  │
│  │         Feeds Repository             │  │
│  │    (Prisma data access layer)        │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
src/rss/
├── dto/               # Data Transfer Objects
├── validation/        # RSS/Atom validators
├── parsing/           # RSS/Atom parsers
├── scheduler/         # Priority queue, retry queue, DLQ
├── health/            # Feed health scoring
├── detection/         # Duplicate detection
├── logs/              # Feed sync logging
├── feeds.repository.ts
├── feeds.service.ts
├── feeds.controller.ts
├── admin-feeds.controller.ts
├── rss.module.ts
└── index.ts
```

## Key Principles

1. **Isolation** - RSS Engine never creates article pages, searchable content, or connects to Search
2. **Imports only** - Title, Excerpt, URL, Publication Date, Author, Image URL, Categories, Language, Metadata
3. **No scraping** - Full article content is never imported
4. **Duplicate prevention** - GUID, canonical URL, normalized URL, and URL hash are all checked
5. **Configurable sync** - Frequencies are not hardcoded; configured via `syncFrequency` (seconds)

## Feed Statuses

| Status     | Description                                      |
|------------|--------------------------------------------------|
| Active     | Feed is active and scheduled for sync            |
| Paused     | Feed is temporarily paused (manual)              |
| Failed     | Feed has exceeded error threshold                |
| Disabled   | Feed has been manually disabled                  |
| Archived   | Feed has been soft-deleted                       |

## Event Integration

| Event               | Trigger                 |
|---------------------|-------------------------|
| FEED_ADDED          | Feed registered         |
| FEED_UPDATED        | Feed config changed     |
| FEED_DISABLED       | Feed disabled/deleted   |
| FEED_FAILED         | Feed moved to DLQ       |
| FEED_RECOVERED      | Feed recovered from DLQ |
| FEED_SYNCED         | Sync cycle completed    |
| ARTICLE_DISCOVERED  | New article imported    |
