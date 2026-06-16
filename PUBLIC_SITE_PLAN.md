# MillionBlogs Public Site Plan

## 1. Homepage Structure

### Purpose

The homepage is the primary public discovery entry for MillionBlogs. It should quickly communicate that the platform helps visitors discover blogs and articles across categories, languages, and promoted opportunities while giving bloggers a clear path to join.

### Sections

- Primary discovery header with search entry, category access, and language access.
- Featured blogs section.
- Trending articles section.
- Latest articles section.
- Category discovery section.
- Language discovery section.
- Promotion placement section with clear sponsored disclosure.
- Blogger CTA section.
- SEO content block explaining the value of blog discovery.
- Footer with internal links to major public routes.

### SEO Goals

- Establish the homepage as the canonical discovery hub.
- Surface crawlable links to blogs, articles, categories, languages, pricing, badges, and support.
- Provide clear metadata for the platform category and value proposition.
- Support hreflang alternates for localized homepages.

### Conversion Goals

- Move visitors into article reading or blog exploration.
- Move bloggers toward registration, blog submission, pricing, or founder/subscription paths.
- Encourage repeat use through PWA install entry points where appropriate.

### Data Requirements

- Featured blogs.
- Trending articles.
- Latest articles.
- Categories.
- Supported languages.
- Promotion pricing or active sponsored placements.
- Badge or verification highlights where available.
- Locale and direction metadata.

## 2. Search Page Structure

### Purpose

The search page helps visitors find relevant articles and blogs by keyword, category, language, and content type.

### Sections

- Search input with submitted query visible.
- Result type tabs for articles and blogs.
- Filters for category, language, recency, and sort where supported.
- Article results list.
- Blog results list.
- Empty state for no results.
- Suggested categories, languages, or latest articles when results are weak or empty.
- Blogger CTA placed after meaningful browsing content, not above results.

### SEO Goals

- Search result pages should generally be noindex to avoid thin or duplicate index pages.
- Search page shell may be crawlable only as a utility page if product policy allows, but query result pages should not compete with category or language pages.
- Preserve canonical links to article, blog, category, and language destination pages.

### Conversion Goals

- Help visitors reach an article or blog quickly.
- Encourage query refinement when results are empty.
- Convert bloggers who search for their own niche into registration or promotion interest.

### Data Requirements

- Article search results.
- Blog search results.
- Autocomplete suggestions.
- Category list.
- Supported languages.
- Pagination metadata.
- Search analytics event hooks.

## 3. Article Page Structure

### Purpose

The article page presents an imported article as a discoverable content entry and sends interested visitors to the source blog when appropriate.

### Sections

- Article title.
- Source blog attribution.
- Publication or ingestion metadata.
- Category and language metadata.
- Article excerpt, summary, or available content preview.
- Primary link to the original blog article.
- Blog trust signals such as verification and badges.
- Related articles.
- Related blog content.
- Promotion placement if it does not interrupt reading intent.
- SEO metadata and structured data.

### SEO Goals

- Make each article page indexable when content quality and canonical policy allow.
- Emit canonical URL according to backend SEO rules.
- Use Article structured data where valid.
- Link clearly to source blog and related internal pages.
- Support hreflang when alternate language versions exist.

### Conversion Goals

- Send visitors to the original blog article.
- Encourage visitors to explore more articles from the same blog.
- Encourage visitors to browse the article category or language.
- Convert blogger visitors through subtle CTA after content or related sections.

### Data Requirements

- Article detail.
- Source blog detail.
- Category metadata.
- Language metadata.
- Related articles.
- Blog badges.
- SEO metadata.
- Structured data fields.
- Promotion eligibility or active placements.

## 4. Blog Page Structure

### Purpose

The blog page is the public profile for a registered blog. It should establish trust, explain the blog's focus, and drive visitors to the blog's articles or external destination.

### Sections

- Blog identity header with name, description, language, category, verification, and badges.
- Primary visit-blog action.
- Latest articles from the blog.
- Popular or featured articles from the blog where available.
- RSS or activity freshness indicator where suitable.
- Related blogs.
- Category and language links.
- Promotion or sponsored campaign disclosure if applicable.
- Blogger ownership CTA only where contextually relevant.

### SEO Goals

- Make blog profile pages indexable.
- Emit Blog or WebSite structured data where valid.
- Use canonical URL from backend SEO rules.
- Provide internal links to article pages, categories, languages, and badges.
- Support hreflang when alternate language data exists.

### Conversion Goals

- Send visitors to the blog's external site.
- Move visitors into article reading.
- Build trust through verification and badges.
- Encourage blog owners to claim, manage, or promote their presence when authenticated or through clear CTA paths.

### Data Requirements

- Blog detail.
- Blog articles.
- Blog badges.
- Feed status summary if public.
- Category metadata.
- Language metadata.
- Related blogs.
- Promotion campaigns where public.
- SEO metadata.

## 5. Category Page Structure

### Purpose

The category page is a topical discovery hub for articles and blogs.

### Sections

- Category header with name and description.
- Featured blogs in the category.
- Trending articles in the category.
- Latest articles in the category.
- Related categories.
- Language filter or language-specific links.
- Promotion placement relevant to the category.
- Blogger CTA for submitting a blog in that category.
- SEO content block for the category.

### SEO Goals

- Rank for topic-level discovery queries.
- Provide crawlable links to article and blog pages.
- Support paginated article archives with deliberate canonical behavior.
- Emit CollectionPage or Breadcrumb structured data where appropriate.
- Support localized category pages and hreflang.

### Conversion Goals

- Move visitors to articles and blogs in the category.
- Encourage bloggers in the category to register or promote.
- Encourage visitors to refine by language or related topics.

### Data Requirements

- Category detail.
- Category articles.
- Category blogs where available.
- Related categories.
- Supported languages for category content.
- Promotion placements.
- SEO metadata.
- Pagination metadata.

## 6. Language Page Structure

### Purpose

The language page helps visitors discover content in a specific language and reinforces MillionBlogs as a global blog discovery platform.

### Sections

- Language header with language name and direction awareness.
- Featured blogs in the language.
- Trending articles in the language.
- Latest articles in the language.
- Category filters for that language.
- Related languages or all-language navigation.
- Blogger CTA localized to the active language.
- SEO content block for language-specific discovery.

### SEO Goals

- Rank for language-specific blog and article discovery.
- Provide crawlable localized content lists.
- Emit hreflang alternates for equivalent language pages.
- Ensure direction and language metadata are correct.
- Build strong internal links between language, category, blog, and article pages.

### Conversion Goals

- Help visitors find content in their preferred language.
- Encourage bloggers publishing in that language to register.
- Encourage switching or exploring other languages where relevant.

### Data Requirements

- Language metadata.
- Blogs in language.
- Articles in language.
- Categories with available language content.
- Related languages.
- SEO metadata.
- Locale and direction metadata.

## 7. Featured Blogs Section

### Purpose

Featured blogs highlight high-quality or strategically important publishers and help visitors discover credible sources quickly.

### Sections

- Section title and short context.
- Curated or algorithmic blog cards.
- Verification and badge indicators.
- Category and language metadata.
- Link to full blog directory.

### SEO Goals

- Surface crawlable links to strong blog pages.
- Reinforce platform trust and topical breadth.
- Support internal link equity toward important blog profiles.

### Conversion Goals

- Increase blog profile visits.
- Encourage visitors to trust the directory.
- Give bloggers an aspirational reason to join and improve their profile.

### Data Requirements

- Featured blog list.
- Blog names, slugs, descriptions, categories, languages.
- Badge and verification data.
- Featured ranking or editorial selection source.

## 8. Trending Articles Section

### Purpose

Trending articles expose timely or high-engagement content and make the public site feel active.

### Sections

- Section title.
- Article cards ranked by trend signal.
- Source blog attribution.
- Category, language, and date metadata.
- Link to broader article directory or category pages.

### SEO Goals

- Provide crawlable links to active article pages.
- Improve freshness signals on discovery pages.
- Distribute internal links to recently important content.

### Conversion Goals

- Increase article clicks.
- Encourage visitors to explore source blogs.
- Reinforce repeat visits by showing fresh movement.

### Data Requirements

- Trending article list.
- Trend score or backend ranking result where exposed.
- Article metadata.
- Source blog metadata.
- Category and language metadata.

## 9. Latest Articles Section

### Purpose

Latest articles show freshness and give newly imported content a discovery path.

### Sections

- Section title.
- Chronological article list.
- Source blog attribution.
- Category, language, and date metadata.
- Link to article archive.

### SEO Goals

- Improve crawl discovery for newly imported articles.
- Provide a predictable internal link path for fresh content.
- Support indexation of new public article pages.

### Conversion Goals

- Move visitors into recent content.
- Encourage bloggers by showing that new content can surface quickly.

### Data Requirements

- Latest article list.
- Publication or ingestion dates.
- Source blog metadata.
- Category and language metadata.
- Pagination or archive link.

## 10. Related Articles Strategy

### Purpose

Related articles keep visitors engaged and strengthen internal linking between similar content.

### Strategy

Related articles should be selected using a hierarchy:

1. Same blog and same category.
2. Same category and same language.
3. Same language with similar topic metadata.
4. Same category across languages.
5. Recent or trending fallback content.

### SEO Goals

- Strengthen topical clusters.
- Improve crawl paths between articles, categories, languages, and blogs.
- Reduce orphaned public article pages.

### Conversion Goals

- Increase article-to-article navigation.
- Increase source blog discovery.
- Encourage deeper browsing sessions.

### Data Requirements

- Current article metadata.
- Related article candidates.
- Category, language, and source blog relationships.
- Trending or latest fallback lists.

## 11. Promotion Placement Strategy

### Purpose

Promotions provide paid visibility while maintaining visitor trust and content quality.

### Placement Rules

- Promotions must always be disclosed.
- Promotions must not interrupt primary reading intent on article pages.
- Promotions should be contextually relevant by category, language, or blog.
- Promotion cards must be visually distinct from organic content but not visually hostile.
- Public pages should balance organic discovery and paid placements.
- Repeated promotion exposure should be controlled to avoid fatigue.

### Recommended Placements

- Homepage: one sponsored discovery area after organic featured or trending content.
- Category pages: relevant promoted blogs or articles after the first organic set.
- Language pages: language-matched promoted content.
- Blog pages: active campaigns for that blog where public.
- Article pages: below article summary or between related sections, not before primary content.
- Search pages: limited sponsored result area only if clearly labeled and relevant.

### SEO Goals

- Avoid making sponsored content appear as undisclosed editorial ranking.
- Preserve crawlable internal links where allowed.
- Prevent promotion blocks from dominating page structure.

### Conversion Goals

- Drive qualified traffic to promoted blogs or articles.
- Encourage bloggers to create promotion campaigns.
- Maintain trust with visitors through clear labeling.

### Data Requirements

- Active promotion campaigns.
- Campaign category and language targeting.
- Promoted blog or article metadata.
- Disclosure labels.
- Rotation or placement rules from backend.

## 12. CTA Strategy for Bloggers

### Purpose

CTAs should convert blog owners and creators without distracting visitors from content discovery.

### CTA Types

- Register your blog.
- Claim or manage your blog.
- Connect RSS feed.
- Promote your blog.
- View pricing.
- Join founder program where available.

### Placement Strategy

- Homepage: primary blogger CTA after initial discovery value is visible.
- Blog directory: contextual CTA for unlisted blogs.
- Category pages: category-specific blogger CTA.
- Language pages: localized blogger CTA.
- Article pages: subtle CTA after content and related articles.
- Search page: CTA when searches suggest a niche or missing blog.
- Public blog page: owner-focused CTA only when appropriate and not confusing to visitors.

### SEO Goals

- Keep CTA copy crawlable but not dominant over content.
- Link to indexable pricing and founder information where public.

### Conversion Goals

- Increase registrations.
- Increase blog submissions.
- Increase feed connections.
- Increase promotion campaign creation.

### Data Requirements

- Current auth state where available.
- Pricing or promotion package summary.
- Founder program availability where public.
- Locale-specific CTA copy.

## 13. SEO Blocks

### Purpose

SEO blocks provide crawlable explanatory content for public discovery pages without making the experience feel like a content farm.

### SEO Block Rules

- Use natural, localized copy.
- Explain the purpose of the page, category, or language.
- Include internal links to related categories, languages, blogs, and articles.
- Avoid repetitive boilerplate across many pages.
- Keep blocks below primary discovery content where possible.
- Do not use hidden text or visually inaccessible SEO-only content.

### Page Usage

- Homepage: platform-level discovery explanation.
- Category page: topic-specific discovery explanation.
- Language page: language-specific discovery explanation.
- Blog page: minimal, profile-specific metadata and links.
- Article page: no generic SEO block unless it supports related discovery.
- Search page: avoid indexable SEO blocks for query results.

### Data Requirements

- Page entity metadata.
- Related categories and languages.
- Internal link targets.
- Localized static text.

## 14. Structured Data Usage

### Purpose

Structured data helps search engines understand MillionBlogs pages and the relationships between blogs, articles, categories, and navigation.

### Structured Data by Page

- Homepage: WebSite, Organization, SearchAction where appropriate.
- Article page: Article or BlogPosting where valid, BreadcrumbList.
- Blog page: Blog, WebSite, or Organization depending on available data, BreadcrumbList.
- Category page: CollectionPage, BreadcrumbList.
- Language page: CollectionPage, BreadcrumbList.
- Badge pages: DefinedTerm or collection-style structured data where appropriate.
- Pricing page: Product or Offer only when backend data supports accurate pricing details.

### Rules

- Structured data must match visible page content.
- Do not invent ratings, reviews, authorship, prices, or publication details.
- Use backend SEO and structured data services as the source of truth when available.
- Localized pages should emit locale-appropriate metadata.
- Sponsored content must not be misrepresented as organic editorial endorsement.

### Data Requirements

- SEO metadata.
- Entity names, descriptions, URLs, dates, images, and relationships.
- Breadcrumb hierarchy.
- Language and canonical URL data.

## 15. Internal Linking Strategy

### Purpose

Internal linking should improve discovery, crawlability, topical relevance, and visitor flow.

### Linking Rules

- Every public article links to its source blog, category, language, and related articles.
- Every public blog links to its articles, categories, language page, and badge explanations.
- Every category page links to articles, blogs, related categories, and language-filtered views.
- Every language page links to articles, blogs, categories, and other language discovery pages.
- Homepage links to top-level discovery routes and selected content.
- Footer links to core public routes, legal pages, pricing, support, and language selection.
- Breadcrumbs should appear on article, blog, category, and language routes where helpful.

### SEO Goals

- Reduce orphaned pages.
- Build category and language clusters.
- Pass link equity to important content.
- Support crawler discovery of new blogs and articles.

### Conversion Goals

- Keep visitors moving through meaningful next steps.
- Increase blog outbound clicks.
- Increase blogger registrations from discovery contexts.

### Data Requirements

- Slugs and canonical URLs.
- Category relationships.
- Language relationships.
- Related content sets.
- Badge definition links.

## 16. Mobile Experience

### Purpose

The mobile public site must support fast reading, easy discovery, and simple conversion.

### Mobile Rules

- Search entry must be prominent and easy to reach.
- Article and blog cards must stack cleanly.
- Metadata should remain readable without overwhelming titles.
- Filters should be compact and reversible.
- Promotion disclosure must remain visible.
- CTAs should appear after value has been shown.
- Tap targets must be comfortable.
- Language and direction switching must remain accessible.
- PWA install prompts must not interrupt reading or search intent.

### SEO Goals

- Preserve crawlable content and semantic structure across mobile layouts.
- Avoid hiding important public links behind inaccessible interactions.
- Maintain Core Web Vitals through stable layouts and optimized media.

### Conversion Goals

- Increase article clicks from mobile discovery.
- Increase blog visits from mobile profiles.
- Increase registration and promotion interest without modal interruption.

### Data Requirements

- Same content data as desktop.
- Image or media variants where available.
- Locale and direction metadata.
- PWA install eligibility state.

## 17. PWA Entry Points

### Purpose

PWA entry points encourage repeat use for readers and bloggers without interrupting content discovery.

### Entry Points

- Homepage after initial engagement.
- Article page after reading or outbound click intent.
- Blog page after repeated visits or engagement.
- Language page for users browsing a specific language.
- Dashboard after login for bloggers.
- Offline fallback route when network is unavailable.

### Rules

- Install prompts should be delayed until user intent is clear.
- Public visitors should see PWA messaging as convenience, not a requirement.
- Bloggers may see stronger PWA entry points in dashboard contexts.
- Offline pages should explain what can and cannot be accessed.
- PWA visuals must respect active theme and locale direction.

### SEO Goals

- PWA entry points must not block crawlable content.
- Manifest and service worker routes must remain technically accessible.

### Conversion Goals

- Encourage repeat visits.
- Improve retention for readers and bloggers.
- Support quick return to dashboard workflows.

### Data Requirements

- Install prompt eligibility.
- Locale and theme.
- Offline state.
- Recently viewed public content where safely available.

## 18. Visitor-to-Blog Click Flow

### Purpose

The visitor-to-blog click flow is the core public value loop: visitors discover content on MillionBlogs and continue to the original blog or more internal discovery pages.

### Flow

1. Visitor lands on homepage, category, language, search, article, or blog page.
2. Visitor scans article or blog cards.
3. Visitor opens an article or blog detail page.
4. Visitor evaluates title, excerpt, source, category, language, badges, and verification.
5. Visitor clicks through to the original blog or continues browsing related internal content.
6. MillionBlogs records allowed analytics events without collecting sensitive data.

### Design Requirements

- Source blog attribution must be visible before click-through.
- External blog links must be clear and trustworthy.
- Internal article and blog links must remain visually distinct from promotion actions.
- Sponsored placements must be disclosed before the visitor commits to the click.
- Related content should offer a meaningful alternative when the visitor does not click out.

### SEO Goals

- Maintain crawlable paths from discovery pages to detail pages.
- Preserve canonical and structured data signals.
- Avoid doorway-page behavior by providing real context and discovery value.

### Conversion Goals

- Increase qualified outbound clicks to blogs.
- Increase internal browsing depth.
- Increase return visits and PWA installs.
- Convert blogger visitors into registrations or promotion customers.

### Data Requirements

- Article and blog metadata.
- External blog URLs.
- Related content.
- Promotion disclosure state.
- Analytics event hooks.
- Locale and direction metadata.
