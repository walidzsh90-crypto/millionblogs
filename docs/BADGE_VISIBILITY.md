# Badge Visibility

## Overview

Founder badges are visual indicators displayed on user profiles. Users can control whether their badge is shown publicly.

## Badge Types

| Badge | Program | Style |
|-------|---------|-------|
| Founder Pro | Founder Pro (paid) | Pro tier badge |
| Founder Master | Founder Master (paid) | Master tier badge |

## Storage

Badge data is stored on the `User` model:

```prisma
model User {
  founderBadge    String?  @map("founder_badge")    // 'Founder Pro' | 'Founder Master' | null
  badgeVisibility Boolean  @default(true)           // true = visible, false = hidden
}
```

## Behavior

- **`founderBadge`**: Set automatically when a founder seat is claimed or upgraded. Remains permanent — never removed, even if the user somehow loses access (badges are permanent achievements).
- **`badgeVisibility`**: User-controlled boolean. When `true`, the badge is shown on the user's profile/display. When `false`, the badge is hidden but still exists.

## APIs

### Current endpoints (Phase 5 Users module)
- Badge visibility toggle is available via user profile update endpoints
- Founder badge is automatically set by the Founder module on seat claim/upgrade

### Future (when user settings UI is built)
- `PATCH /users/me/badge-visibility` — Toggle `badgeVisibility`
- `GET /users/:id/profile` — Returns `founderBadge` only if `badgeVisibility` is true

## Events

`FOUNDER_SEAT_CLAIMED` — badge set on claim
`FOUNDER_UPGRADED` — badge updated on upgrade
