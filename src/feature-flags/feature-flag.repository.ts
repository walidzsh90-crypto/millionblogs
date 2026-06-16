import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  FeatureFlagEntity,
  CreateFeatureFlagData,
  UpdateFeatureFlagData,
} from './interfaces/feature-flag.interface';

@Injectable()
export class FeatureFlagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string): Promise<FeatureFlagEntity | null> {
    return this.prisma.featureFlag.findFirst({
      where: { key, deletedAt: null },
    });
  }

  async findAll(): Promise<FeatureFlagEntity[]> {
    return this.prisma.featureFlag.findMany({
      where: { deletedAt: null },
      orderBy: { key: 'asc' },
    });
  }

  async findEnabled(): Promise<FeatureFlagEntity[]> {
    return this.prisma.featureFlag.findMany({
      where: { isEnabled: true, deletedAt: null },
    });
  }

  async create(data: CreateFeatureFlagData): Promise<FeatureFlagEntity> {
    return this.prisma.featureFlag.create({ data });
  }

  async update(key: string, data: UpdateFeatureFlagData): Promise<FeatureFlagEntity> {
    return this.prisma.featureFlag.update({
      where: { key },
      data,
    });
  }

  async softDelete(key: string): Promise<void> {
    await this.prisma.featureFlag.update({
      where: { key },
      data: { deletedAt: new Date() },
    });
  }

  async isEnabled(key: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findFirst({
      where: { key, deletedAt: null },
      select: { isEnabled: true },
    });
    return flag?.isEnabled ?? false;
  }
}
