import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { NotificationFilterDto } from './dto/notification-filter.dto';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; type: string; title: string; body?: string; data?: Record<string, unknown> }) {
    return this.prisma.notification.create({ data: data as any });
  }

  async findByUserId(userId: string, filter: NotificationFilterDto) {
    const where: Record<string, unknown> = { userId, deletedAt: null };
    if (filter.type) where.type = filter.type;
    if (filter.unreadOnly) where.readAt = null;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null, deletedAt: null },
      data: { readAt: new Date() },
    });
    return { count: result.count };
  }

  async archive(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  async delete(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null, deletedAt: null } });
  }
}
