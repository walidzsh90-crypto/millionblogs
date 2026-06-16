import { Injectable } from '@nestjs/common';
import { BaseVerificationStrategy, VerificationResult } from './base.strategy';
import { PrismaService } from '../../prisma';

@Injectable()
export class HistoricalDataStrategy extends BaseVerificationStrategy {
  name = 'historical_data';
  weight = 0.20;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verify(blogId: string): Promise<VerificationResult> {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { id: true, createdAt: true },
    });

    if (!blog) {
      return { passed: false, score: 0, details: { error: 'Blog not found' } };
    }

    const details: Record<string, unknown> = {};
    let score = 1.0;

    // Check blog age
    const ageInDays = Math.floor(
      (Date.now() - new Date(blog.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    details.ageInDays = ageInDays;

    if (ageInDays < 1) {
      score -= 0.3;
    }

    // Check for previous rejections
    const previousRejections = await this.prisma.blogVerification.count({
      where: { blogId, status: 'rejected' },
    });
    details.previousRejections = previousRejections;

    if (previousRejections >= 3) {
      score -= 0.3;
    } else if (previousRejections >= 1) {
      score -= 0.1;
    }

    // Check history events
    const suspiciousEvents = await this.prisma.event.count({
      where: {
        aggregateId: blogId,
        eventName: { in: ['blog.suspended', 'blog.reported'] },
      },
    });
    details.suspiciousEvents = suspiciousEvents;

    if (suspiciousEvents > 0) {
      score -= 0.3;
    }

    const passed = score >= 0.5;
    return { passed, score: Math.max(0, score), details };
  }
}
