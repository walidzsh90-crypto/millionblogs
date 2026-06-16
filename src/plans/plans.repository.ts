import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { PlanFilterDto } from './dto/plan-filter.dto';

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    price?: number;
    currency?: string;
    visibility?: string;
    features?: Record<string, unknown>;
    limits?: Record<string, unknown>;
    isFree?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.plan.create({ data: data as any });
  }

  async findById(id: string) {
    return this.prisma.plan.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.plan.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async findMany(filter: PlanFilterDto) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.status) where.status = filter.status;
    if (filter.visibility) where.visibility = filter.visibility;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.plan.findMany({
        where: where as any,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.plan.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findActive() {
    return this.prisma.plan.findMany({
      where: { status: 'active', deletedAt: null, visibility: 'public' },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.plan.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'archived' },
    });
  }
}
