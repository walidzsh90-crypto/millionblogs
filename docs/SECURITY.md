# MillionBlogs — Security

## Password Hashing

- Algorithm: bcrypt
- Salt rounds: 12
- Stored as `$2b$12$...` string in `User.passwordHash`

## JWT

- Algorithm: HS256
- Access token: 15-minute expiry
- Refresh token: 7-day expiry (stored hashed in DB)
- Secret: Configurable via `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

## Brute Force Protection

Implemented in `BruteForceService`:

- **Window**: 15 minutes
- **Max attempts**: 5
- **Block duration**: 30 minutes
- **Scope**: Per email address
- **Reset**: On successful login

## HTTP Security Headers

Applied via Helmet middleware:

| Header | Value |
|---|---|
| Content-Security-Policy | Restrictive (self, inline styles, https images) |
| Strict-Transport-Security | 1 year, include subdomains, preload |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |

## Rate Limiting

| Endpoint Group | Limit | Window |
|---|---|---|
| Auth endpoints | 5 requests | 60 seconds |
| Write endpoints | 30 requests | 60 seconds |
| Read endpoints | 100 requests | 60 seconds |
| Health endpoints | Skipped (SkipThrottle) |

## CORS

- Origins: Configurable via `CORS_ORIGINS` environment variable (comma-separated)
- Credentials: Allowed
- Max age: 1 hour

## Input Sanitization

- `SanitizationService` provides HTML tag stripping, URL validation, email normalization.
- Class-validator DTOs enforce structural validation at the controller boundary.
