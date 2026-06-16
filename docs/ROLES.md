# MillionBlogs — Roles & Permissions

## Role Definitions

| Role | Level | Description |
|---|---|---|
| `visitor` | 0 | Unauthenticated or not yet a blogger |
| `blogger` | 1 | Registered user (default on registration) |
| `admin` | 2 | Platform staff |
| `super_admin` | 3 | Full system access |

## Usage

```typescript
import { Roles, ROLES } from '../roles';

@Controller('admin')
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN) // Class-level
export class AdminController {
  @Get('stats')
  @Roles(ROLES.SUPER_ADMIN) // Method-level override
  async getStats() { ... }
}
```

## Running the Guard

The `RolesGuard` is registered globally in `RolesModule`. It checks the `user.role` property set by `JwtAuthGuard`. If no `@Roles()` decorator is present, access is granted to all authenticated users.

## Permission Constants

```typescript
export const ROLES = {
  VISITOR: 'visitor',
  BLOGGER: 'blogger',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const ROLE_HIERARCHY = {
  visitor: 0,
  blogger: 1,
  admin: 2,
  super_admin: 3,
};
```
