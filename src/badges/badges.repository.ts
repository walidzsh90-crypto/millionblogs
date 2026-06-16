import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class BadgesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; slug: string; description?: string; svgContent?: string; type?: string; isActive?: boolean }) {
    return this.prisma.badge.create({ data });
  }

  async findById(id: string) {
    return this.prisma.badge.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return this.prisma.badge.findUnique({ where: { slug } });
  }

  async findAll() {
    return this.prisma.badge.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'asc' } });
  }

  async findAllActive() {
    return this.prisma.badge.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { createdAt: 'asc' } });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.badge.update({ where: { id }, data });
  }

  async archive(id: string) {
    return this.prisma.badge.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async assignBadge(userId: string, badgeId: string, isVisible = true) {
    return this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      update: { revokedAt: null, isVisible },
      create: { userId, badgeId, isVisible },
    });
  }

  async revokeBadge(userId: string, badgeId: string) {
    return this.prisma.userBadge.update({
      where: { userId_badgeId: { userId, badgeId } },
      data: { revokedAt: new Date() },
    });
  }

  async getUserBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId, revokedAt: null },
      include: { badge: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getUserVisibleBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId, isVisible: true, revokedAt: null, badge: { isActive: true, deletedAt: null } },
      include: { badge: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async setBadgeVisibility(userId: string, badgeId: string, isVisible: boolean) {
    return this.prisma.userBadge.update({
      where: { userId_badgeId: { userId, badgeId } },
      data: { isVisible },
    });
  }

  async findUserBadge(userId: string, badgeId: string) {
    return this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
      include: { badge: true },
    });
  }

  async getStats() {
    const [total, byType] = await Promise.all([
      this.prisma.badge.count({ where: { deletedAt: null } }),
      this.prisma.badge.groupBy({ by: ['type'], _count: true, where: { deletedAt: null } }),
    ]);

    return { total, byType: byType.reduce((acc: Record<string, number>, t: { type: string; _count: number }) => ({ ...acc, [t.type]: t._count }), {}) };
  }
}
