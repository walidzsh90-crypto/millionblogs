# Sitemaps

## Sitemap Structure

```
sitemap.xml (index)
├── sitemap/articles.xml     (50,000 articles max)
├── sitemap/blogs.xml        (all verified/public blogs)
├── sitemap/categories.xml   (all active categories)
└── sitemap/languages.xml    (27 supported languages)
```

## Main Sitemap (sitemap.xml)

Sitemap index file referencing all sub-sitemaps.

```
GET /sitemap.xml
```

## Article Sitemap (articles.xml)

Contains published articles ordered by most recent. Limited to 50,000 entries per sitemap spec.

- **changefreq**: weekly
- **priority**: 0.8

```
GET /sitemap/articles.xml
```

## Blog Sitemap (blogs.xml)

Contains all verified and public blogs.

- **changefreq**: daily
- **priority**: 0.9

```
GET /sitemap/blogs.xml
```

## Category Sitemap (categories.xml)

Contains all active categories.

- **changefreq**: weekly
- **priority**: 0.6

```
GET /sitemap/categories.xml
```

## Language Sitemap (languages.xml)

Contains all 27 supported language pages.

- **changefreq**: daily
- **priority**: 0.5

```
GET /sitemap/languages.xml
```

## robots.txt

Dynamic `robots.txt` is generated at:

```
GET /robots.txt
```

Content:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /user/

Sitemap: https://millionblogs.com/sitemap.xml
Crawl-Delay: 10
Host: https://millionblogs.com
```
