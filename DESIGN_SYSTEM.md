# MillionBlogs Design System

## 1. Design Philosophy

MillionBlogs is a publishing, discovery, and growth platform for bloggers. The design system must balance editorial warmth with operational clarity.

The public website should feel trustworthy, readable, and content-forward. It should help visitors discover articles, blogs, categories, languages, badges, and promoted content without visual noise.

The user dashboard should feel focused, calm, and productive. It should help bloggers understand status, complete setup tasks, manage visibility, and make promotion or payment decisions with confidence.

The admin dashboard should feel dense, precise, and auditable. It should prioritize scanning, filtering, comparison, confirmation, and safe handling of privileged actions.

Core principles:

- Content first: article and blog content must remain the visual priority.
- Clarity over decoration: visual treatments should explain hierarchy, state, and action.
- Global by default: multilingual and bidirectional layouts must feel native, not adapted later.
- Trust through consistency: status, errors, badges, payments, and promotions must use predictable visual language.
- Progressive density: public pages may breathe more; dashboards should use compact, repeatable patterns.

## 2. Brand Positioning

MillionBlogs should present itself as a serious, modern directory and growth platform for independent publishers.

Brand traits:

- Editorial: clear typography, strong reading rhythm, restrained imagery.
- Credible: no exaggerated visual effects, no gamified clutter around trust signals.
- Useful: interaction patterns should feel direct and efficient.
- Global: language and direction support should be visible in the information architecture.
- Growth-oriented: promotion and badge systems should feel valuable without overpowering organic content.

The brand should avoid:

- Overly playful social-network styling.
- Cryptocurrency, casino, or ad-network visual cues.
- Heavy gradients as the primary brand expression.
- Decorative card-heavy layouts where dense operational UI is needed.
- Color-only meaning for status or trust.

## 3. Color System

The color system must support public editorial surfaces, authenticated dashboards, admin workflows, badges, promotions, and accessible status communication.

Recommended token groups:

- Brand: primary actions, active navigation, selected controls.
- Neutral: page backgrounds, surfaces, borders, dividers, text.
- Accent: discovery highlights, editorial accents, non-critical emphasis.
- Semantic success: completed, verified, paid, healthy.
- Semantic warning: pending, expiring, degraded, requires attention.
- Semantic danger: destructive, failed, blocked, suspended.
- Semantic info: neutral guidance, in-progress, system messages.
- Promotion: sponsored placement, campaign surfaces, paid visibility.
- Badge: achievement and trust-marker variants.

Color rules:

- Text contrast must meet WCAG AA at minimum.
- Color must never be the only indicator of state.
- Public content cards should use neutral surfaces and reserve strong colors for meaning.
- Promotion colors must distinguish sponsored content without making it look unsafe or low-quality.
- Admin danger states must be visually distinct from normal destructive buttons and require confirmation patterns.

## 4. Light Mode

Light mode is the default presentation for public SEO pages and dashboard workflows.

Light mode goals:

- High readability for long article titles, excerpts, and metadata.
- Clean white or near-white page backgrounds.
- Slightly separated surfaces for cards, tables, and forms.
- Subtle borders preferred over heavy shadows.
- Strong enough text hierarchy for scanning lists.

Light mode rules:

- Primary text must be near-neutral and not pure brand color.
- Secondary metadata must remain readable at small sizes.
- Borders should be visible enough to define dense dashboard sections.
- Highlight surfaces must not reduce text contrast.
- Sponsored and promoted surfaces must remain legible and clearly labeled.

## 5. Dark Mode

Dark mode must be a first-class theme, not an inverted light mode.

Dark mode goals:

- Comfortable reading for public article and blog discovery.
- Clear operational hierarchy in dashboards.
- Reduced glare without losing contrast.
- Preserved semantic color meaning.

Dark mode rules:

- Backgrounds should use layered neutrals, not pure black for every surface.
- Text contrast must be strong enough for body copy and table data.
- Borders may need higher opacity than light mode.
- Shadows should be replaced or supplemented by borders and surface contrast.
- Semantic colors must be adjusted for dark backgrounds and tested independently.
- Promotion and badge treatments must not become neon or visually dominant.

## 6. Typography Scale

Typography must serve reading, scanning, and operational clarity.

Type roles:

- Display: public hero or major page identity only.
- Page title: main public, dashboard, or admin page heading.
- Section title: major content sections and dashboard groups.
- Card title: blog, article, promotion, and dashboard cards.
- Body: article excerpts, descriptions, explanations.
- Metadata: author, date, category, language, status, counts.
- Control: buttons, tabs, labels, table headers.
- Code/token: verification snippets, IDs, technical values.

Typography rules:

- Public article and blog text should use generous line height.
- Dashboard and admin text should use tighter but still readable line height.
- Metadata should be visually secondary but not faint.
- Button and label text must remain legible on mobile.
- Do not rely on uppercase for long labels, international text, or translated strings.
- Avoid negative letter spacing.
- Long words, URLs, emails, and localized labels must wrap safely.

## 7. Spacing System

Spacing should use a consistent scale across public pages and dashboards.

Spacing principles:

- Public pages use larger section spacing to support content discovery.
- Dashboard pages use tighter spacing to improve repeated workflows.
- Admin pages use the densest spacing, while preserving touch targets and readability.
- Related controls should sit closer than unrelated sections.
- Page-level spacing should not be simulated by nesting cards inside cards.

Spacing rules:

- Use consistent vertical rhythm between headings, descriptions, controls, and lists.
- Keep table controls, filters, and pagination visually connected to their tables.
- Maintain sufficient spacing around destructive actions.
- Avoid excessive gutters on mobile.
- Empty, loading, and error states should occupy the same approximate space as the content they replace when possible.

## 8. Border Radius System

Radius should communicate product maturity and interface density.

Radius rules:

- Small radius for dashboard and admin controls.
- Moderate radius for public content cards and media containers.
- Larger radius only for brand moments, empty states, or install prompts where appropriate.
- Repeated cards should use consistent radius across blog, article, promotion, and dashboard systems.
- Tables, dense filters, and admin controls should avoid overly rounded shapes.

Suggested radius categories:

- None: table grid boundaries, dividers, full-width sections.
- Small: inputs, buttons, badges, compact controls.
- Medium: cards, menus, popovers.
- Large: modals, PWA install prompts, major public media containers.

## 9. Shadows and Elevation

Elevation should be functional and restrained.

Elevation roles:

- Base surface: no shadow, border or background separation only.
- Raised card: subtle shadow for public cards or important dashboard panels.
- Overlay: stronger shadow for menus, dropdowns, popovers, dialogs.
- Critical overlay: modal confirmations and blocking flows.

Rules:

- Prefer borders and background contrast for dashboard structure.
- Use shadows sparingly on admin pages.
- Avoid stacked shadowed cards.
- Dark mode elevation should rely on surface contrast and borders more than shadow opacity.
- Hover elevation should not cause layout shift.

## 10. Icon Strategy

Icons support recognition, compact controls, and status scanning. They must not carry meaning alone.

Icon rules:

- Use a single icon style family throughout the product.
- Use icons for common actions such as search, edit, delete, filter, sort, download, upload, external link, notification, wallet, settings, and verification.
- Pair icons with labels where the action is uncommon, destructive, or business-critical.
- Directional icons must mirror in RTL contexts.
- Status icons should pair with text or accessible labels.
- Avoid decorative icons in dense dashboards unless they improve scanning.

Icon sizing:

- Small icons for metadata and table actions.
- Medium icons for buttons, navigation, empty states, and toasts.
- Large icons only for empty states or PWA install prompts.

## 11. Badge Design System

Badges represent trust, achievement, status, or platform-granted recognition. They must feel credible and not decorative.

Badge categories:

- Verification: ownership or authenticity confirmed.
- Founder: founder program participation.
- Quality: editorial or platform quality markers.
- Activity: contribution, consistency, or milestone markers.
- Administrative: suspended, pending review, restricted, or internal-only indicators.

Badge rules:

- Each badge must have a label, icon or mark, color treatment, and accessible text.
- Trust badges must be visually distinct from promotional labels.
- Public badges should be compact and legible near blog names.
- Dashboard badges may include explanatory text and status details.
- Admin badges should include enough context to support moderation decisions.
- Badge meaning must remain stable across light and dark modes.

## 12. Promotion Card System

Promotion cards represent paid visibility while preserving user trust.

Promotion card rules:

- Sponsored or promoted status must be clearly labeled.
- Promotion cards must not visually impersonate organic content.
- They should share enough structure with article or blog cards to remain scannable.
- Paid campaign metadata should be visible in dashboards but minimized on public discovery pages.
- Calls to action must be clear and not misleading.
- Expired, pending, canceled, or depleted campaigns must have distinct states.

Public promotion cards:

- Emphasize content value, blog identity, and disclosure.
- Avoid aggressive ad-like styling.
- Maintain strong content hierarchy.

Dashboard promotion cards:

- Emphasize campaign status, budget, spend, dates, performance, and next action.
- Clearly separate setup, active, paused, completed, canceled, and failed states.

## 13. Blog Card System

Blog cards represent publisher identity and trust.

Blog card content hierarchy:

- Blog name.
- Verification or badge indicators.
- Description or excerpt.
- Category, language, and update metadata.
- Owner or author context where appropriate.
- Follow, visit, manage, or admin action depending on surface.

Blog card rules:

- Blog identity must be readable at a glance.
- Verification and badges must not overpower the blog name.
- Language and category metadata should support discovery.
- Public cards should invite exploration.
- Dashboard cards should emphasize ownership, feed status, verification, and management actions.
- Admin cards should emphasize moderation status, owner, risk signals, and operational actions.

## 14. Article Card System

Article cards represent content discovery and reading intent.

Article card content hierarchy:

- Article title.
- Source blog.
- Excerpt or summary.
- Category and language.
- Publication or ingestion date.
- Optional image or media when available.
- Promotion disclosure when sponsored.

Article card rules:

- Titles must support multiple lines without layout breakage.
- Excerpts should be readable but not dominate listings.
- Source blog attribution must be clear.
- Dates and metadata must be consistently formatted by locale.
- Cards should support image-present and image-absent variants.
- Public cards should prioritize click-through to content.
- Admin variants should include status, deletion state, and moderation actions where relevant.

## 15. Dashboard Card System

Dashboard cards summarize account, blog, feed, promotion, wallet, notification, and support states.

Dashboard card rules:

- Each card should answer one operational question.
- Cards should have clear titles, current values, state labels, and primary actions.
- Dense dashboard cards should avoid decorative media.
- Status cards must use semantic state patterns consistently.
- Cards should not be nested inside other cards.
- Cards should preserve stable height where repeated in grids.

Dashboard card categories:

- Metric cards.
- Status cards.
- Task cards.
- Alert cards.
- Resource cards.
- Billing or wallet cards.

## 16. Table Design Rules

Tables are primary patterns for admin and repeated dashboard workflows.

Table rules:

- Tables should support server-backed pagination.
- Filters and search should be visually tied to the table.
- Column labels must be clear and localizable.
- Numeric values should align consistently.
- Dates should use locale-aware formats.
- Status cells should use text plus semantic visual treatment.
- Row actions should be compact but discoverable.
- Destructive row actions require confirmation.
- Empty table states should explain the current filter result.
- Mobile tables should transform into readable stacked rows or priority-column layouts.

Admin table requirements:

- Show enough context to avoid opening every detail page.
- Keep audit-relevant fields visible where possible.
- Avoid truncating critical identifiers without an expansion path.
- Distinguish soft-deleted, suspended, pending, and active states.

## 17. Form Design Rules

Forms must be clear, forgiving, and aligned with backend validation.

Form rules:

- Labels are always visible.
- Required fields must be indicated consistently.
- Help text should explain business meaning, not repeat labels.
- Validation should appear near the relevant field.
- Backend validation errors must map to fields where possible.
- Form-level errors should explain non-field failures.
- Destructive submissions require confirmation.
- Multi-step flows should show progress and preserve entered data where safe.
- Inputs should support translated labels, long values, and RTL direction.
- Disabled states must communicate why an action is unavailable when the reason is not obvious.

Domain-specific forms:

- Auth forms must minimize friction and protect sensitive data.
- Blog and RSS forms must clearly communicate verification and feed health outcomes.
- Promotion forms must make price, budget, duration, and expected result boundaries clear.
- Payment forms must clearly hand off to Stripe and show return state.
- Admin forms must show the impact of privileged changes before submission.

## 18. Empty States

Empty states should guide the next useful action without sounding like marketing.

Empty state rules:

- Explain what is missing.
- Explain whether the state is expected, filtered, permission-related, or actionable.
- Provide one primary next action where appropriate.
- Avoid large decorative visuals in dense dashboard or admin contexts.
- Public empty states should preserve discovery paths.
- Filtered empty states should offer clear reset options.

Examples of empty state categories:

- No blogs registered.
- No RSS feed connected.
- No articles imported yet.
- No promotions active.
- No transactions yet.
- No notifications.
- No search results.
- No admin records for current filters.

## 19. Loading States

Loading states must preserve confidence and layout stability.

Loading rules:

- Use skeletons for repeated cards, lists, tables, and dashboard panels.
- Use spinners only for small inline actions or blocking submission states.
- Preserve navigation and page structure during loading.
- Avoid skeletons that imply unavailable content types.
- Long-running operations should show progress language or a retry-safe pending state.
- Mutating actions should show local pending state and prevent duplicate submission.

Surface-specific loading:

- Public pages should render primary SEO content server-side where possible.
- Dashboard pages may use skeleton panels for private data.
- Admin tables should show loading rows and preserve filter controls.

## 20. Error States

Error states should help users recover while protecting sensitive details.

Error state rules:

- Use plain language and localized messages.
- Pair the message with a recovery action where possible.
- Preserve user input unless unsafe.
- Do not expose tokens, stack traces, raw backend errors, or sensitive IDs.
- Distinguish validation errors, permission errors, missing resources, conflicts, network failures, and system errors.
- Use semantic danger treatment for destructive or blocking errors.
- Use warning treatment for degraded or partial states.

Common patterns:

- Inline field error.
- Form-level error.
- Page-level not found.
- Access denied.
- Offline or retry state.
- Conflict state.
- System unavailable state.

## 21. Success States

Success states should confirm completion and guide the next step.

Success rules:

- Confirm what changed.
- Show resulting status when relevant.
- Avoid excessive celebration for routine admin or billing actions.
- Use persistent success messages only when users may need to reference the result.
- Use transient success messages for routine saves.
- Provide next action for multi-step flows.

Domain examples:

- Blog registered.
- Ownership verification started or completed.
- Feed connected.
- Campaign created or canceled.
- Payment completed.
- Support ticket submitted.
- Profile updated.
- Admin action completed.

## 22. Mobile-First Rules

MillionBlogs must work well on mobile for public reading and dashboard essentials.

Mobile rules:

- Primary navigation must remain simple and reachable.
- Reading pages must prioritize title, source, excerpt, metadata, and content.
- Touch targets must be large enough for comfortable use.
- Tables must adapt into stacked or priority views.
- Forms must avoid cramped multi-column layouts.
- Sticky actions may be used when they improve task completion.
- Long labels and translated strings must wrap without clipping.
- Dashboard metrics should stack before forming grids.
- Admin workflows may be supported on mobile but should not compromise safety or clarity.

Mobile public pages should not feel like compressed desktop pages. They should use a deliberate reading and discovery hierarchy.

## 23. RTL Design Rules

RTL support is a design requirement across public, dashboard, and admin surfaces.

RTL rules:

- Layout direction follows locale.
- Navigation order, breadcrumbs, pagination, and directional controls mirror correctly.
- Icons that imply motion or direction must mirror.
- Logical spacing should replace left/right assumptions.
- Tables should align text according to content and locale expectations.
- Mixed LTR technical values such as URLs, emails, tokens, and IDs must remain readable.
- Charts, metrics, and timelines should define whether data direction is semantic or locale-mirrored.
- Badge, status, and metadata clusters must preserve hierarchy in both directions.

RTL review must be part of design QA for every reusable pattern.

## 24. Accessibility Requirements

Accessibility is required across all surfaces.

Requirements:

- WCAG 2.2 AA minimum.
- Keyboard navigation for all interactive controls.
- Visible focus states.
- Accessible names for icon-only controls.
- Text alternatives for meaningful images.
- Semantic headings and landmarks.
- Form labels and error associations.
- Sufficient color contrast in light and dark modes.
- No color-only status communication.
- Reduced-motion support for animations and transitions.
- Screen-reader friendly loading, error, and success states.
- Dialogs, menus, and overlays must manage focus correctly.
- Touch targets must be usable on mobile.

Content accessibility:

- Article and blog titles must remain text, not image-only.
- Badges and verification states must expose accessible labels.
- Sponsored or promoted disclosures must be programmatically available.
- Language changes inside content should be marked where needed.

## 25. PWA Visual Requirements

The PWA experience must feel native enough to trust, while remaining clearly MillionBlogs.

PWA visual requirements:

- App icon system must be legible at small sizes.
- Splash and install surfaces must use brand colors and clear naming.
- Offline states must explain what is available and what requires connection.
- Cached public content must not appear fresher than it is.
- Update prompts must be clear, non-alarming, and easy to act on.
- Install prompts must not interrupt critical reading, auth, payment, or admin flows.
- Standalone display mode must preserve navigation, safe areas, and theme color.
- Light and dark mode theme colors must match the active theme.
- Loading and offline indicators must be visible without feeling like errors unless action is blocked.

PWA design should enhance repeat use for readers and bloggers without making security-sensitive dashboard or admin data appear available when it is not.
