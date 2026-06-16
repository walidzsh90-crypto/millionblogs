# Articles Module

## Overview

The Articles module manages public content in MillionBlogs. Articles are the public-facing representation of content discovered via the RSS Engine or created manually. Each Article is distinct from `RssFeedEntry` — the RSS entry is a discovery record, while the Article is published public content.

## Separation from RssFeedEntry

```
RssFeedEntry (discovery record)       Article (public content)
├── id                                ├── id
├── feedId                            ├── blogId
├── guid                              ├── feedEntryId (nullable link back)
├── canonicalUrl                      ├── canonicalUrl
├── urlHash                           ├── urlHash
├── title                             ├── title
├── excerpt                           ├── excerpt
├── ...                               ├── featuredImageUrl
│                                     ├── author
│                                     ├── language
│                                     ├── languageConfidence
│                                     ├── publishedAt
│                                     ├── status
│                                     ├── slug
│                                     ├── viewCount / clickCount / CTR
│                                     ├── source / importSource
│                                     └── ...
```

## Article Statuses

| Status     | Description                                      |
|------------|--------------------------------------------------|
| Draft      | Not yet published                                |
| Processing | Being processed by the pipeline                  |
| Published  | Visible to the public                            |
| Rejected   | Failed validation or manual rejection            |
| Archived   | Soft-deleted                                     |

## Stored Fields (only)

- Title
- Excerpt (max 500 chars, no HTML)
- Canonical URL
- Publication Date
- Author
- Featured Image URL
- Language
- Categories
- Metadata (view count, click count, CTR)
- Blog Reference

## Never Stored

- Full article body
- Scraped article content
- Copied article text

## Events

| Event               | Trigger                 |
|---------------------|-------------------------|
| ARTICLE_CREATED     | Article record created  |
| ARTICLE_PUBLISHED   | Article goes public     |
| ARTICLE_REJECTED    | Article rejected        |
| ARTICLE_ARCHIVED    | Article archived/deleted|
| ARTICLE_UPDATED     | Article modified        |

## API Controllers

- `PublicArticlesController` — public read-only endpoints (`GET /articles`)
- `UserArticlesController` — authenticated user CRUD (`POST /user/articles`)
- `AdminArticlesController` — admin management (`GET /admin/articles`)
