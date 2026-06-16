# Legal Compliance Implementation

## Pages Added

| Page | Route | Type | SEO | Content Locales |
|---|---|---|---|---|
| Privacy Policy | `/privacy` | SSR + ISR (900s) | generateMetadata, canonical, hreflang, BreadcrumbList JSON-LD | en, ar, nl |
| Terms of Service | `/terms` | SSR + ISR (900s) | generateMetadata, canonical, hreflang, BreadcrumbList JSON-LD | en, ar, nl |
| Cookie Policy | `/cookies` | SSR + ISR (900s) | generateMetadata, canonical, hreflang, BreadcrumbList JSON-LD | en, ar, nl |

## Navigation Locations

| Location | Links | Component |
|---|---|---|
| Public footer | Blogs, Articles, Categories, Languages, Support, Privacy Policy, Terms of Service, Cookie Policy | `shared/components/layout/site-footer.tsx` |
| Dashboard footer | Privacy Policy, Terms of Service, Cookie Policy | `features/dashboard/components/dashboard-shell.tsx` |

## User Consent Touchpoints

| Touchpoint | Type | Location |
|---|---|---|
| Registration | Required checkbox: "I agree to Terms of Service and Privacy Policy" | `features/auth/components/register-form.tsx:71-85` |
| Purchase flow | Legal notice: "By continuing, you agree to the Terms of Service and Privacy Policy" | `features/purchase/components/purchase-form.tsx:104-110` |

## Implementation Details

### Content Architecture
- All legal content is stored in `shared/content/legal-content.ts`
- Each locale (en, ar, nl) has its own content object for each policy
- Content is structured into sections with `heading` and `body`
- Pages use `getContent(locale)` to select the right locale, falling back to English

### SEO
- Each page exports `generateMetadata` with `createMetadata()`, `createCanonicalPath()`, `createHreflangAlternates()`
- BreadcrumbList JSON-LD structured data on every legal page
- ISR revalidation set to 900 seconds

### Accessibility
- `<main>` landmark with proper heading hierarchy (h1, h2)
- `<nav aria-label="Breadcrumb">` for breadcrumb navigation
- `<nav aria-label="Legal">` for footer legal navigation
- Registration checkbox uses `aria-describedby` for screen reader context

### RTL/LTR
- Supported via the existing `localeDirections` config in `i18n/config.ts`
- All pages use the same SSR layout which respects `dir` attribute

## Remaining Compliance Gaps

| Gap | Severity | Notes |
|---|---|---|
| Cookie consent banner | High | No cookie consent prompt for EU users before analytics cookies fire |
| Cookie consent preference storage | High | No way for users to reject analytics cookies; relying on browser settings only |
| Data export UI | Medium | Privacy policy mentions data export from account settings, but no export endpoint/UI exists |
| Account deletion UI | Medium | Privacy policy mentions account deletion via support ticket, but no self-service deletion |
| GDPR/CCPA request form | Medium | No dedicated form for data subject access requests |
| DMCA policy | Low | No copyright infringement reporting process documented |
| Cookie consent preference center | Low | No UI to change cookie preferences after initial choice |
| Data processing agreement | Low | No DPA available for business users |
| Accessibility statement | Low | No accessibility compliance statement page |
| Cookie preference `localStorage` persistence | Low | Essential — once consent banner is implemented, preference must persist |
