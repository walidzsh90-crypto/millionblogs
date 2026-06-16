# MillionBlogs — Identity Layer

## Files Created

| Module | Files | Purpose |
|---|---|---|
| **Common** | `src/common/security/password.service.ts` | bcrypt hashing |
| | `src/common/security/brute-force.service.ts` | Rate-limit failed logins |
| **Roles** | `src/roles/roles.constants.ts` | Role hierarchy and levels |
| | `src/roles/roles.decorator.ts` | `@Roles()` decorator |
| | `src/roles/roles.guard.ts` | Global role check guard |
| | `src/roles/roles.service.ts` | Role assignment |
| | `src/roles/roles.module.ts` | Module definition |
| **Users** | `src/users/users.repository.ts` | Prisma-based persistence |
| | `src/users/users.service.ts` | Business logic |
| | `src/users/users.controller.ts` | REST endpoints |
| | `src/users/dto/*.ts` | Create, update, response DTOs |
| | `src/users/decorators/current-user.decorator.ts` | `@CurrentUser()` param decorator |
| | `src/users/users.module.ts` | Module definition |
| **Sessions** | `src/sessions/sessions.repository.ts` | Prisma-based persistence |
| | `src/sessions/sessions.service.ts` | Business logic |
| | `src/sessions/sessions.controller.ts` | REST endpoints |
| | `src/sessions/sessions.module.ts` | Module definition |
| **Auth** | `src/auth/auth.service.ts` | Registration, login, logout, refresh, password reset, email verify |
| | `src/auth/auth.controller.ts` | 8 REST endpoints |
| | `src/auth/strategies/jwt.strategy.ts` | Passport JWT extraction |
| | `src/auth/guards/jwt-auth.guard.ts` | JWT + optional guards |
| | `src/auth/dto/*.ts` | Register, login, refresh, forgot/reset, tokens DTOs |
| | `src/auth/auth.module.ts` | Module definition |
| **Events** | `src/events/event-names.ts` | Centralized event name constants |

## API Endpoints

```
POST   /api/v1/auth/register       # Register
POST   /api/v1/auth/login          # Login
POST   /api/v1/auth/refresh        # Rotate tokens
POST   /api/v1/auth/logout         # Revoke session
POST   /api/v1/auth/logout-all     # Revoke all sessions
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
GET    /api/v1/users/me            # Get profile
PATCH  /api/v1/users/me            # Update profile
GET    /api/v1/users/:id           # Admin: get user
GET    /api/v1/sessions            # List sessions
DELETE /api/v1/sessions/:id        # Revoke session
```

## Database Tables Added

- `users` — Core user entity with profile, role, password history, email verification
- `sessions` — Refresh token hashes with device tracking
- `password_resets` — One-time reset tokens with expiry

## Events Implemented

- `user.registered` — Emitted after successful registration
- `user.logged_in` — Emitted after successful login
- `user.logged_out` — Emitted after session revocation
- `password.reset_requested` — Emitted when reset token is created
- `password.changed` — Emitted after successful password reset
- `session.revoked` — Emitted when a session is manually revoked

## Audit Coverage

All auth operations are audited: registration, login, logout, password reset, session revocation. Activity events record user joins and profile updates.
