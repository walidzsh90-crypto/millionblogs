import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class PromotionPackagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    creditCost: number;
    duration: number;
    priority?: number;
    status?: string;
    visibility?: string;
    sortOrder?: number;
  }) {
    return this.prisma.promotionPackage.create({ data });
  }

  async findById(id: string) {
    return this.prisma.promotionPackage.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return this.prisma.promotionPackage.findUnique({ where: { slug } });
  }

  async findAllActive() {
    return this.prisma.promotionPackage.findMany({
      where: { status: 'active', visibility: 'public' },
      orderBy: [{ sortOrder: 'asc' }, { priority: 'desc' }],
    });
  }

  async findAll() {
    return this.prisma.promotionPackage.findMany({
      orderBy: [{ sortOrder: 'asc' }, { priority: 'desc' }],
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.promotionPackage.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.promotionPackage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
