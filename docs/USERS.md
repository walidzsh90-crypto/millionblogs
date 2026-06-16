# MillionBlogs — Users System

## User Model

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, verified |
| passwordHash | VARCHAR(255) | bcrypt, 12 rounds |
| displayName | VARCHAR(100) | Public name |
| avatarUrl | VARCHAR(2048) | Profile image |
| role | VARCHAR(20) | `visitor`, `blogger`, `admin`, `super_admin` |
| emailVerifiedAt | TIMESTAMPTZ | Null until verified |
| emailVerifyToken | VARCHAR(255) | One-time verification token |
| language | VARCHAR(10) | User locale (default: `en`) |
| timezone | VARCHAR(50) | User timezone (default: `UTC`) |
| badgeVisibility | BOOLEAN | Show badges on profile (default: `true`) |
| isActive | BOOLEAN | Soft-disabled flag |
| lastLoginAt | TIMESTAMPTZ | Last successful login |
| passwordChangedAt | TIMESTAMPTZ | Last password change |
| passwordHistory | JSONB | Recent hashes (prevents reuse) |

## Profile Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | JWT | Get current user profile |
| PATCH | `/api/v1/users/me` | JWT | Update profile (displayName, avatar, language, timezone, badgeVisibility) |
| GET | `/api/v1/users/:id` | JWT + Admin | Get user by ID |

## Role Assignments

Roles are assigned directly on the `User.role` field. The hierarchy is:

```
visitor (0) → blogger (1) → admin (2) → super_admin (3)
```

- `@Roles(Role.ADMIN, Role.SUPER_ADMIN)` decorator grants access if user role level >= required level.
- The `RolesGuard` is registered globally in `RolesModule`.
