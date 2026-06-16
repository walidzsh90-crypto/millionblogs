import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import * as crypto from 'crypto';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    refreshToken: string;
    deviceInfo?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    expiresAt: Date;
  }) {
    const refreshTokenHash = this.hashToken(data.refreshToken);
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshTokenHash,
        deviceInfo: data.deviceInfo ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        lastActivityAt: new Date(),
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByRefreshToken(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    return this.prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async findByRefreshTokenIncludeRevoked(refreshToken: string) {
    const refreshTokenHash = this.hashToken(refreshToken);
    return this.prisma.session.findFirst({
      where: { refreshTokenHash },
      include: { user: true },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async revoke(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: string, excludeSessionId?: string) {
    const where: Record<string, unknown> = {
      userId,
      revokedAt: null,
    };
    if (excludeSessionId) {
      where.id = { not: excludeSessionId };
    }
    return this.prisma.session.updateMany({
      where: where as any,
      data: { revokedAt: new Date() },
    });
  }

  async updateActivity(id: string) {
    return this.prisma.session.update({
      where: { id },
      data: { lastActivityAt: new Date() },
    });
  }

  async deleteExpired() {
    return this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async findRecentPasswordReset(userId: string, withinMinutes: number) {
    return this.prisma.passwordReset.findFirst({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - withinMinutes * 60 * 1000) },
        usedAt: null,
      },
    });
  }

  async createPasswordReset(userId: string, token: string, expiresAt: Date) {
    return this.prisma.passwordReset.create({
      data: { userId, token, expiresAt },
    });
  }

  async findPasswordResetByToken(token: string) {
    return this.prisma.passwordReset.findUnique({ where: { token } });
  }

  async markPasswordResetAsUsed(id: string) {
    return this.prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
