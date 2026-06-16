import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.checkMemory(),
      () => this.checkStorage(),
    ]);
  }

  async ping(): Promise<{ status: string; timestamp: string }> {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      return { database: { status: 'down', message: (error as Error).message } };
    }
  }

  private async checkMemory(): Promise<HealthIndicatorResult> {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    return {
      memory: {
        status: heapUsedMB < heapTotalMB * 0.9 ? 'up' : 'down',
        heapUsedMB,
        heapTotalMB,
      },
    };
  }

  private async checkStorage(): Promise<HealthIndicatorResult> {
    return { storage: { status: 'up' } };
  }
}
