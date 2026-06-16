import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';

export const AUDIT_KEY = 'audit_action';

@Injectable()
export class AuditDecorator {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  async recordFromContext(context: ExecutionContext): Promise<void> {
    const action = this.reflector.get<string>(AUDIT_KEY, context.getHandler());
    if (!action) return;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { method, path, ip, headers } = request;

    await this.auditService.record({
      actorId: user?.id ?? null,
      action,
      resourceType: path.split('/')[2] ?? 'unknown',
      resourceId: request.params?.id ?? path,
      changeset: request.body ? { body: request.body } : null,
      ipAddress: ip,
      userAgent: headers['user-agent'] ?? null,
      metadata: { method, path },
    });
  }
}

export const AuditAction = (action: string) => Reflect.metadata(AUDIT_KEY, action);
