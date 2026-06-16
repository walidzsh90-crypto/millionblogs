# Plan Lifecycle

## Overview

Plans define the product catalog. Founder Programs and Subscriptions are the membership types. This document describes how plans relate to the membership lifecycle.

## Plan Types

| Slug | Type | Billing | Price |
|------|------|---------|-------|
| free | Standing | None | Free |
| founder-pro | Founder | Lifetime | $15.95 |
| founder-master | Founder | Lifetime | $50 |
| pro-monthly | Subscription | Monthly | $9.99 |
| pro-yearly | Subscription | Yearly | $99.99 |
| master-monthly | Subscription | Monthly | $29.99 |
| master-yearly | Subscription | Yearly | $299.99 |

## Plan → Membership Mapping

### Founder Programs
- Plan `founder-pro` → FounderProgram `founder-pro` → FounderSeat
- Plan `founder-master` → FounderProgram `founder-master` → FounderSeat

### Subscriptions
- Plan `pro-monthly` → UserSubscription with 30-day periods
- Plan `pro-yearly` → UserSubscription with 365-day periods
- Plan `master-monthly` → UserSubscription with 30-day periods
- Plan `master-yearly` → UserSubscription with 365-day periods

## Membership State Machine

```
                    ┌──────────┐
                    │  Pending  │
                    └────┬─────┘
                         │ activate
                    ┌────▼─────┐
              ┌─────│  Active   │──────┐
              │     └────┬─────┘      │
         cancel    ┌────▼─────┐   suspend
              │     │ Grace    │       │
              │     │ Period   │       │
              │     └────┬─────┘       │
              │          │ expire      │
              │     ┌────▼─────┐  ┌────▼─────┐
              └─────│ Expired  │  │Suspended │
                    └──────────┘  └──────────┘
                    ┌──────────┐
                    │Cancelled │
                    └──────────┘
```

## Founder vs Subscription Exclusivity

- A user can have EITHER a founder seat OR a subscription, not both
- Founders have lifetime access — they never need subscriptions
- FeatureAccessService resolves founder first, then subscription, then free
