# Badges System

## Overview

Badges are SVG-based visual indicators that can be assigned to users. They are managed by admins and displayed on user profiles.

## Badge Types

| Type | Description |
|------|-------------|
| founder | Founder program badges (auto-assigned) |
| verification | Verification achievements |
| achievement | Platform achievements |
| custom | User-created (admin approved) |
| admin | Admin-only badges |

## Data Model

```prisma
model Badge {
  name: string
  slug: string (unique)
  svgContent: string (SVG markup)
  type: 'founder' | 'verification' | 'achievement' | 'custom' | 'admin'
  isActive: boolean
}

model UserBadge {
  userId: string
  badgeId: string
  isVisible: boolean  // user-controlled visibility
  revokedAt: DateTime? // null = active
}
```

## Badge Visibility

- Default: visible
- User can toggle visibility per badge at any time
- Badges remain assigned even when hidden
- Hidden badges are not returned in public profile queries

## APIs

### Public
- `GET /badges` — List all badges
- `GET /badges/user/:userId` — Get user's visible badges

### User
- `GET /account/badges` — Get my badges (including hidden)
- `POST /account/badges/:id/visibility` — Toggle visibility `{ visible: boolean }`

### Admin
- `POST /admin/badges` — Create badge
- `PUT /admin/badges/:id` — Update badge
- `POST /admin/badges/:id/archive` — Archive badge (soft delete)
- `POST /admin/badges/assign` — Assign badge `{ userId, badgeId }`
- `POST /admin/badges/:badgeId/revoke/:userId` — Revoke badge
- `GET /admin/badges/stats` — Stats by type

## Events

- `BADGE_CREATED`, `BADGE_ASSIGNED`, `BADGE_REVOKED`, `BADGE_VISIBILITY_CHANGED`
