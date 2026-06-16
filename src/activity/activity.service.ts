import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ActivityEntry } from './interfaces/activity.interface';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: ActivityEntry): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          actorId: entry.actorId,
          type: entry.type,
          resource: entry.resource,
          resourceId: entry.resourceId,
          context: entry.context as any,
          metadata: entry.metadata as any,
        },
      });
    } catch (error) {
      this.logger.error(
        { err: error, entry },
        'Failed to record activity entry',
      );
    }
  }

  async findByUser(actorId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByResource(resource: string, resourceId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { resource, resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
