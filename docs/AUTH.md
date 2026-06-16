# MillionBlogs — Authentication System

## Overview

The authentication system uses JWT access tokens (short-lived) combined with refresh tokens (long-lived, stored as hashed sessions). Refresh token rotation ensures that a compromised token is detected and invalidated upon use.

---

## Flow

### Registration

```
Client                          AuthService                          Database
  │                                │                                   │
  │ POST /api/v1/auth/register     │                                   │
  │ { email, password, name } ────►                                   │
  │                                │ Validate input                    │
  │                                │ Check email uniqueness            │
  │                                │ Hash password (bcrypt, 12 rounds) │
  │                                │ Generate emailVerifyToken         │
  │                                │ ─── INSERT user ─────────────────►│
  │                                │ Generate JWT access + refresh     │
  │                                │ Create session (hashed refresh)   │
  │                                │ Emit UserRegistered event         │
  │ ◄── { accessToken, refresh, user } ───────────────────────────────│
```

### Login

```
Client                          AuthService                          Database
  │                                │                                   │
  │ POST /api/v1/auth/login        │                                   │
  │ { email, password } ──────────►                                   │
  │                                │ Check brute-force block            │
  │                                │ Find user by email                 │
  │                                │ Verify password hash               │
  │                                │ Update lastLoginAt                 │
  │                                │ Generate JWT access + refresh     │
  │                                │ Create session (hashed refresh)   │
  │                                │ Emit UserLoggedIn event           │
  │ ◄── { accessToken, refresh, user } ───────────────────────────────│
```

### Token Refresh (Rotation)

```
Client                          AuthService                          Database
  │                                │                                   │
  │ POST /api/v1/auth/refresh      │                                   │
  │ { refreshToken } ────────────►                                   │
  │                                │ Find session by hashed token      │
  │                                │ Check not revoked / not expired   │
  │                                │ Revoke old session                │
  │                                │ Generate new access + refresh     │
  │                                │ Create new session                │
  │ ◄── { accessToken, refresh, user } ───────────────────────────────│
```

---

## Token Specifications

| Token | Type | Lifetime | Storage | Rotation |
|---|---|---|---|---|
| Access Token | JWT (signed) | 15 minutes | Client memory | Not applicable |
| Refresh Token | UUID v4 | 7 days | Hashed in DB `sessions` table | Every use |

### JWT Payload

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "blogger",
  "iat": 1700000000,
  "exp": 1700000900
}
```

---

## Session Management

- Each login creates a new `Session` record storing the hashed refresh token, device info, IP, and user agent.
- Users can list and revoke sessions via `GET /sessions` and `DELETE /sessions/:id`.
- "Logout all" revokes every session except the current one (if a refresh token is provided).
- Expired sessions are periodically cleaned up.

---

## Password Policy

| Rule | Value |
|---|---|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase | Required |
| Lowercase | Required |
| Digit | Required |
| Special character | Required |
| Common passwords | Blocked |

---

## Brute Force Protection

- 5 failed password attempts within a 15-minute window locks the account for 30 minutes.
- Each failed attempt increments the counter per email address.
- Successful login resets the counter.

---

## Guards

| Guard | Purpose |
|---|---|
| `JwtAuthGuard` | Validates JWT access token from `Authorization: Bearer <token>` |
| `OptionalAuthGuard` | Attaches user if token present, does not reject anonymous requests |
| `RolesGuard` | Checks user role against `@Roles()` decorator (global, registered in app module) |

---

## Endpoints

| Method | Route | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | None | 5/min | Register new user |
| POST | `/api/v1/auth/login` | None | 5/min | Login |
| POST | `/api/v1/auth/refresh` | None | 10/min | Refresh tokens |
| POST | `/api/v1/auth/logout` | JWT | 10/min | Logout (revoke session) |
| POST | `/api/v1/auth/logout-all` | JWT | 5/min | Revoke all sessions |
| POST | `/api/v1/auth/forgot-password` | None | 3/min | Request password reset |
| POST | `/api/v1/auth/reset-password` | None | 5/min | Reset password |
| POST | `/api/v1/auth/verify-email` | None | 5/min | Verify email |

---

## Events

| Event | Publisher | Consumers | Payload |
|---|---|---|---|
| `user.registered` | AuthService | ActivityService, AuditService | `{ userId, email, displayName }` |
| `user.logged_in` | AuthService | AuditService | `{ userId, email }` |
| `user.logged_out` | AuthService | AuditService | `{ userId, sessionId }` |
| `password.reset_requested` | AuthService | (email service) | `{ userId, email, token }` |
| `password.changed` | AuthService | ActivityService | `{ userId }` |
| `session.revoked` | SessionsService | AuditService | `{ userId, sessionId }` |
