import { Injectable } from '@nestjs/common';
import { BaseVerificationStrategy, VerificationResult } from './base.strategy';
import { PrismaService } from '../../prisma';

@Injectable()
export class ContentCheckStrategy extends BaseVerificationStrategy {
  name = 'content_check';
  weight = 0.25;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verify(blogId: string): Promise<VerificationResult> {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { name: true, description: true, url: true },
    });

    if (!blog) {
      return { passed: false, score: 0, details: { error: 'Blog not found' } };
    }

    const issues: string[] = [];
    let score = 1.0;

    if (!blog.name || blog.name.length < 2) {
      issues.push('Blog name is too short');
      score -= 0.3;
    }
    if (!blog.description || blog.description.length < 20) {
      issues.push('Blog description is too short or missing');
      score -= 0.3;
    }
    if (!blog.url) {
      issues.push('Blog URL is missing');
      score -= 0.2;
    }

    const passed = score >= 0.5;
    return { passed, score: Math.max(0, score), details: { issues, blogName: blog.name } };
  }
}
