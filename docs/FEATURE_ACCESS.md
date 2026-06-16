# Feature Access Resolution

## Overview

`FeatureAccessService` is the single source of truth for determining what features and limits a user has. It resolves against three tiers in priority order:

1. **Founder Program** (highest)
2. **Active Subscription** (medium)
3. **Free Tier** (lowest)

## Resolution Order

```
User
 ├─ Has Founder Seat? ──→ Founder features + limits
 ├─ Has Active Subscription? ──→ Plan features + limits
 └─ Free user ──→ Default free features + limits
```

## FeatureAccess Interface

```typescript
interface FeatureAccess {
  userId: string;
  isFounder: boolean;
  founderBadge: string | null;
  founderProgram: string | null;
  hasActiveSubscription: boolean;
  activeSubscriptionId: string | null;
  activePlanId: string | null;
  activePlanSlug: string | null;
  effectivePlan: string;    // 'founder_pro' | 'founder_master' | 'pro-monthly' | etc | 'free'
  features: string[];
  limits: Record<string, unknown>;
}
```

## API

```typescript
// Get full access object
const access = await featureAccessService.resolve(userId);

// Quick feature check
const canAccess = await featureAccessService.hasAccess(userId, 'custom_domain');
```

## Feature Definitions

### Free Tier
- `basic_blogging`, `single_blog`, `rss_import`, `basic_search`
- Limits: 1 blog, 100 articles, 5 feeds, 1GB storage

### Founder Pro / Pro Monthly/Yearly
- Plan-defined features + limits
- Default: 10 blogs, 10K articles, 100 feeds, 10GB storage

### Founder Master / Master Monthly/Yearly
- Plan-defined features + limits
- Default: 100 blogs, 100K articles, 500 feeds, 100GB storage

## Events

`FEATURE_ACCESS_CHANGED` is emitted whenever the resolution changes (seat claim, subscription change, etc.).
