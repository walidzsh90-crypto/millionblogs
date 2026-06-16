import { Injectable } from '@nestjs/common';
import { Role, ROLE_HIERARCHY } from './roles.constants';

@Injectable()
export class RolesService {
  private readonly assignments = new Map<string, Role>();

  async getRole(userId: string): Promise<Role | null> {
    return this.assignments.get(userId) ?? null;
  }

  async assignRole(userId: string, role: Role): Promise<void> {
    this.assignments.set(userId, role);
  }

  hasMinRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  }
}
