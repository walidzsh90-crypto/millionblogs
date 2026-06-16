# MillionBlogs — Sessions System

## Session Model

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| refreshTokenHash | VARCHAR(255) | SHA-256 of refresh token |
| deviceInfo | TEXT | Platform info (e.g., "Windows") |
| ipAddress | VARCHAR(45) | Client IP |
| userAgent | TEXT | Browser user agent |
| lastActivityAt | TIMESTAMPTZ | Updated on token refresh |
| expiresAt | TIMESTAMPTZ | Auto-expiry (matches refresh token TTL) |
| revokedAt | TIMESTAMPTZ | Null if active |

## Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/sessions` | JWT | List active sessions for current user |
| DELETE | `/api/v1/sessions/:id` | JWT | Revoke a specific session |

## Security Properties

1. **Refresh token rotation**: Every refresh creates a new session and revokes the old one.
2. **Hashed storage**: Refresh tokens are stored as SHA-256 hashes. The raw token is only sent once.
3. **Expiry**: Sessions auto-expire after the refresh token TTL (default: 7 days).
4. **Cleanup**: `deleteExpired()` is called periodically via cron.
