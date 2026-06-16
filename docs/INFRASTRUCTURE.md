# MillionBlogs — Infrastructure Foundation

## Overview

This document describes the production-grade backend infrastructure for the MillionBlogs platform.

---

## Architecture

```
src/
├── main.ts                          # Application bootstrap
├── app.module.ts                    # Root module
├── config/                          # Environment validation & config
├── prisma/                          # Database client & connection management
├── common/
│   ├── errors/                      # Exception filters & domain errors
│   ├── logging/                     # Structured JSON logging with correlation IDs
│   ├── health/                      # Health check endpoints & service
│   └── security/                    # Helmet, CORS, rate limiting, password policy
├── feature-flags/                   # Feature flag service & repository
├── audit/                           # Immutable audit logging
├── activity/                        # Activity tracking
├── events/                          # Domain event bus (in-process via EventEmitter2)
├── jobs/                            # Background job framework with retry & dead letter
├── backup/                          # Backup/restore contracts
└── observability/                   # Metrics, tracing, performance monitoring
```

---

## Modules

### 1. ConfigModule

**Purpose**: Centralized environment variable loading and validation using Zod schemas.  
**Key Features**:
- Runtime validation of all required environment variables
- Typed getters for each configuration section
- Parsed values for CORS origins, booleans, etc.
- Environment detection (`isDev`, `isProd`, `isTest`)

### 2. PrismaModule

**Purpose**: Database connection management via Prisma ORM.  
**Key Features**:
- Extends `PrismaClient` for direct access
- Lifecycle hooks: `onModuleInit` (connect) and `onModuleDestroy` (disconnect)
- Global module — single instance across the application

### 3. LoggingModule

**Purpose**: Structured JSON logging with request correlation.  
**Key Features**:
- `CorrelationIdMiddleware` — generates/forwards `x-correlation-id` header
- `RequestIdMiddleware` — generates `x-request-id` header, echoed in response
- `LoggingService` — typed log methods (info, warn, error, debug, fatal)
- Automatic metadata enrichment

### 4. HealthModule

**Purpose**: Application health monitoring endpoints.  
**Endpoints**:
- `GET /health` — Full health check (DB, memory, storage)
- `GET /health/live` — Liveness probe (Kubernetes)
- `GET /health/ready` — Readiness probe (Kubernetes)

### 5. SecurityModule

**Purpose**: Application security foundation.  
**Key Features**:
- Helmet middleware for HTTP security headers
- CORS configuration from environment
- Rate limiting via `@nestjs/throttler` (global guard)
- `PasswordPolicyService` — validates password strength
- `SanitizationService` — input sanitization (HTML strip, URL validation, email normalization)

### 6. FeatureFlagModule

**Purpose**: Feature flag infrastructure for gradual rollouts.  
**Key Features**:
- `FeatureFlagService` — check, enable, disable flags with in-memory cache
- `FeatureFlagRepository` — Prisma-backed persistence
- `@FeatureFlag()` decorator for controller-level gating
- Automatic cache invalidation on flag changes

### 7. AuditModule

**Purpose**: Immutable audit trail for sensitive operations.  
**Key Features**:
- `AuditService` — record and query audit entries
- `AuditAction()` decorator for automatic auditing from controller methods
- Structured with actor, action, resource, changeset, IP, user agent
- Failed audit writes are logged but never throw

### 8. ActivityModule

**Purpose**: Activity stream for user-facing history.  
**Key Features**:
- `ActivityService` — record and query activity entries
- Separated from audit for query performance (activity is queried by users, audit by admins)

### 9. EventBusModule

**Purpose**: In-process domain event publishing and subscription.  
**Key Features**:
- `DomainEvent` — base class with eventId, aggregateId, timestamp
- `DomainEventPublisher` — publishes via `EventEmitter2`
- `DomainEventSubscriber` — abstract base class for consumers
- `OnDomainEvent()` decorator for event handler methods
- Supports wildcard patterns and async handlers

### 10. JobsModule

**Purpose**: Background job processing with retry and dead-letter support.  
**Key Features**:
- `JobService` — enqueue and process jobs with automatic retry
- `JobRetryService` — exponential backoff calculation
- `DeadLetterService` — capture and replay failed jobs
- In-memory by default; pluggable to Bull/Redis later

### 11. BackupModule

**Purpose**: Backup and restore contracts (provider-agnostic).  
**Key Features**:
- `BackupService` — create, restore, list backups
- `BackupProvider` interface — implement for local, S3, or custom storage
- No default provider — must be registered at bootstrap

### 12. ObservabilityModule

**Purpose**: Metrics collection, distributed tracing, and performance monitoring.  
**Key Features**:
- `MetricsService` — gauge, increment, timing operations
- `TracingService` — span creation and lifecycle
- `PerformanceInterceptor` — automatic HTTP request timing

---

## Error Handling

| Error Type | Status | Code | Source |
|---|---|---|---|
| DomainError | 400-409 | Custom | Application rules |
| ValidationError | 422 | VALIDATION_ERROR | Input validation |
| InfrastructureError | 500 | INFRASTRUCTURE_ERROR | External services |
| HttpException | 400-500 | HTTP_ERROR | NestJS built-in |
| Unhandled | 500 | INTERNAL_ERROR | Unknown errors |

All errors produce a standardized response:
```json
{
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [{ "field": "email", "constraints": ["Invalid email"] }],
  "requestId": "abc-123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

---

## Testing

### Unit Tests

Located in `test/unit/`, mirroring the `src/` structure:
```bash
npm run test:unit
```

### Integration Tests

Located in `test/integration/`:
```bash
npm run test:e2e
```

### Test Structure

- `test/factories/` — Test data factories
- `test/setup.ts` — Environment configuration for tests
- `test/test-utils.ts` — Shared test utilities
