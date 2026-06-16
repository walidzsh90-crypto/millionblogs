import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AuditEntry, AuditQuery } from './interfaces/audit.interface';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          changeset: entry.changeset as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata as any,
        },
      });
    } catch (error) {
      this.logger.error(
        { err: error, entry },
        'Failed to record audit entry',
      );
    }
  }

  async query(query: AuditQuery) {
    const where: Record<string, unknown> = {};

    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) (where.createdAt as Record<string, unknown>).gte = query.startDate;
      if (query.endDate) (where.createdAt as Record<string, unknown>).lte = query.endDate;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }
}
