import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);

  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000;
  private readonly BLOCK_DURATION_MS = 30 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async recordAttempt(identifier: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.WINDOW_MS);

    const existing = await this.prisma.bruteForceAttempt.findFirst({
      where: {
        identifier,
        firstAttemptAt: { gte: windowStart },
        blockedUntil: null,
      },
      orderBy: { firstAttemptAt: 'desc' },
    });

    if (existing) {
      const attempts = existing.attempts + 1;
      const blockedUntil = attempts >= this.MAX_ATTEMPTS
        ? new Date(now.getTime() + this.BLOCK_DURATION_MS)
        : null;

      await this.prisma.bruteForceAttempt.update({
        where: { id: existing.id },
        data: { attempts, blockedUntil },
      });

      if (blockedUntil) {
        this.logger.warn({ identifier }, 'Brute force threshold reached');
      }
    } else {
      await this.prisma.bruteForceAttempt.create({
        data: { identifier, attempts: 1, firstAttemptAt: now },
      });
    }
  }

  async isBlocked(identifier: string): Promise<boolean> {
    const now = new Date();

    const blocked = await this.prisma.bruteForceAttempt.findFirst({
      where: {
        identifier,
        blockedUntil: { gt: now },
      },
      orderBy: { blockedUntil: 'desc' },
    });

    if (blocked) return true;

    await this.prisma.bruteForceAttempt.deleteMany({
      where: { identifier, blockedUntil: { lte: now } },
    });

    return false;
  }

  async reset(identifier: string): Promise<void> {
    await this.prisma.bruteForceAttempt.deleteMany({
      where: { identifier },
    });
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.WINDOW_MS);

    const entry = await this.prisma.bruteForceAttempt.findFirst({
      where: {
        identifier,
        firstAttemptAt: { gte: windowStart },
        blockedUntil: null,
      },
      orderBy: { firstAttemptAt: 'desc' },
    });

    if (!entry) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - entry.attempts);
  }
}
