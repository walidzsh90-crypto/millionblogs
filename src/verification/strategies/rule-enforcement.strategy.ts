import { Injectable } from '@nestjs/common';
import { BaseVerificationStrategy, VerificationResult } from './base.strategy';
import { PrismaService } from '../../prisma';

@Injectable()
export class RuleEnforcementStrategy extends BaseVerificationStrategy {
  name = 'rule_enforcement';
  weight = 0.35;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verify(blogId: string): Promise<VerificationResult> {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { name: true, url: true, primaryLanguage: true },
    });

    if (!blog) {
      return { passed: false, score: 0, details: { error: 'Blog not found' } };
    }

    const violations: string[] = [];
    let score = 1.0;

    // Profanity check (simplified)
    const profanityList = ['spam', 'viagra', 'casino', 'xxx'];
    for (const word of profanityList) {
      if (blog.name?.toLowerCase().includes(word)) {
        violations.push(`Name contains prohibited term: ${word}`);
        score -= 0.4;
      }
      if (blog.url?.toLowerCase().includes(word)) {
        violations.push(`URL contains prohibited term: ${word}`);
        score -= 0.3;
      }
    }

    // URL format check
    try {
      const url = new URL(blog.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        violations.push('URL must use HTTP or HTTPS protocol');
        score -= 0.2;
      }
    } catch {
      violations.push('Invalid URL format');
      score -= 0.3;
    }

    const passed = score >= 0.5;
    return { passed, score: Math.max(0, score), details: { violations } };
  }
}
