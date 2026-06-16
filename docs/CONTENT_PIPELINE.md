# Content Pipeline

## Overview

The Content Pipeline transforms RSS discoveries into public MillionBlogs articles. It is orchestrated by `ContentPipelineService` and runs as a multi-stage processing chain.

## Pipeline Stages

```
RSS Discovery
     │
     ▼
┌─────────────┐
│  1. Validate │  Check title exists, URL valid, date valid, language valid
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 2. Normalize │  Clean URLs, titles, categories, authors, languages
└──────┬──────┘
       │
       ▼
┌─────────────┐
│3. Deduplicate│  Check across all blogs, feeds, languages
└──────┬──────┘
       │
       ▼
┌─────────────┐
│4. Language   │  Primary RSS → content detection → English fallback
│  Detection   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│5. Categorize │  Manual IDs → RSS match → blog defaults
└──────┬──────┘
       │
       ▼
┌─────────────┐
│6. Generate   │  Create unique slug
│  Slug       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 7. Create    │  Write Article record + assign categories
│  Article    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 8. Publish   │  Emit ARTICLE_CREATED + ARTICLE_PUBLISHED
│  Events     │
└─────────────┘
       │
       ▼
  Public Article
```

## Pipeline Input

```typescript
interface PipelineInput {
  feedEntryId: string;      // Link to the RSS discovery record
  blogId: string;           // Target blog
  title: string;
  excerpt: string | null;
  canonicalUrl: string;
  featuredImageUrl: string | null;
  author: string | null;
  language: string | null;
  categories: string[];
  publishedAt: Date | null;
  importSource: string;     // Feed URL
}
```

## Pipeline Output

```typescript
interface PipelineOutput {
  articleId: string;
  slug: string;
  status: string;
  validationPassed: boolean;
  validationErrors: string[];
  normalizationApplied: string[];
  deduplicationResult: 'new' | 'duplicate_*' | 'none';
  languageDetected: string;
  languageConfidence: number | null;
  categoriesAssigned: string[];
  published: boolean;
}
```

## Integration

The pipeline is triggered from two places:
1. **RSS Engine sync** — After a feed sync discovers new entries, each entry can be sent through the pipeline
2. **Manual creation** — When a user creates an article directly via the API
