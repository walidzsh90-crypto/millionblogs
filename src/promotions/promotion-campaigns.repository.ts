import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CampaignFilterDto } from './dto/campaign-filter.dto';

@Injectable()
export class PromotionCampaignsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    packageId: string;
    type: string;
    targetId?: string;
    status?: string;
    creditsBudget?: number;
    startDate?: Date;
    endDate?: Date;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.promotionCampaign.create({ data });
  }

  async findById(id: string) {
    return this.prisma.promotionCampaign.findUnique({
      where: { id },
      include: { package: true },
    });
  }

  async findByUserId(userId: string, filter: CampaignFilterDto) {
    const where: Record<string, unknown> = { userId };
    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.promotionCampaign.findMany({
        where: where as any,
        include: { package: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promotionCampaign.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findAll(filter: CampaignFilterDto) {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.promotionCampaign.findMany({
        where: where as any,
        include: { package: true, user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.promotionCampaign.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findActiveForRotation() {
    return this.prisma.promotionCampaign.findMany({
      where: {
        status: 'active',
        endDate: { gte: new Date() },
      },
      include: { package: true },
      orderBy: [{ weight: 'desc' }, { impressions: 'asc' }],
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.promotionCampaign.update({ where: { id }, data });
  }

  async recordAnalytics(campaignId: string, type: string, metadata?: Record<string, unknown>) {
    const field = type === 'click' ? 'clicks' : 'impressions';
    const [analytics] = await Promise.all([
      this.prisma.promotionAnalytics.create({
        data: { campaignId, type, metadata: metadata as any },
      }),
      this.prisma.promotionCampaign.update({
        where: { id: campaignId },
        data: {
          [field]: { increment: 1 },
          creditsSpent: { increment: type === 'click' ? 1 : 1 },
        },
      }).then(async () => {
        const campaign = await this.prisma.promotionCampaign.findUnique({
          where: { id: campaignId },
          select: { clicks: true, impressions: true },
        });
        if (campaign) {
          const ctr = campaign.impressions > 0
            ? campaign.clicks / campaign.impressions
            : 0;
          await this.prisma.promotionCampaign.update({
            where: { id: campaignId },
            data: { ctr },
          });
        }
      }),
    ]);
    return analytics;
  }

  async getStats() {
    const [total, active, completed, totalCreditsSpent, totalImpressions, totalClicks] = await Promise.all([
      this.prisma.promotionCampaign.count(),
      this.prisma.promotionCampaign.count({ where: { status: 'active' } }),
      this.prisma.promotionCampaign.count({ where: { status: 'completed' } }),
      this.prisma.promotionCampaign.aggregate({ _sum: { creditsSpent: true } }),
      this.prisma.promotionCampaign.aggregate({ _sum: { impressions: true } }),
      this.prisma.promotionCampaign.aggregate({ _sum: { clicks: true } }),
    ]);

    return {
      total,
      active,
      completed,
      totalCreditsSpent: totalCreditsSpent._sum.creditsSpent || 0,
      totalImpressions: totalImpressions._sum.impressions || 0,
      totalClicks: totalClicks._sum.clicks || 0,
    };
  }
}
