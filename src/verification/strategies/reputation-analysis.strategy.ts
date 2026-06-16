import { Injectable } from '@nestjs/common';
import { BaseVerificationStrategy, VerificationResult } from './base.strategy';
import { PrismaService } from '../../prisma';

@Injectable()
export class ReputationAnalysisStrategy extends BaseVerificationStrategy {
  name = 'reputation_analysis';
  weight = 0.20;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verify(blogId: string): Promise<VerificationResult> {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { id: true, userId: true },
    });

    if (!blog) {
      return { passed: false, score: 0, details: { error: 'Blog not found' } };
    }

    const details: Record<string, unknown> = {};
    let score = 1.0;

    // Check user's other blogs
    const userBlogs = await this.prisma.blog.findMany({
      where: { userId: blog.userId, deletedAt: null },
      select: { id: true, status: true },
    });
    details.totalUserBlogs = userBlogs.length;

    const activeBlogs = userBlogs.filter((b: any) => b.status === 'verified' || b.status === 'published');
    details.activeBlogs = activeBlogs.length;

    if (activeBlogs.length >= 3) {
      score += 0.2; // bonus for established blogger
    }

    // Check for previously suspended blogs
    const suspendedCount = userBlogs.filter((b: any) => b.status === 'suspended').length;
    if (suspendedCount > 0) {
      score -= 0.3 * Math.min(suspendedCount, 3);
    }

    // Check user verification events
    const verifiedBlogs = await this.prisma.blog.count({
      where: { userId: blog.userId, status: 'verified', id: { not: blogId } },
    });
    details.previouslyVerifiedBlogs = verifiedBlogs;

    if (verifiedBlogs > 0) {
      score += 0.1;
    }

    const passed = score >= 0.5;
    return { passed, score: Math.max(0, Math.min(1, score)), details };
  }
}
