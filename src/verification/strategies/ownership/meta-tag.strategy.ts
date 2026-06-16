import { Injectable } from '@nestjs/common';
import { BaseVerificationStrategy, VerificationResult } from '../base.strategy';
import { PrismaService } from '../../../prisma';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MetaTagStrategy extends BaseVerificationStrategy {
  name = 'meta_tag';
  weight = 0;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verify(blogId: string): Promise<VerificationResult> {
    const verification = await this.prisma.blogVerification.findFirst({
      where: { blogId, method: 'meta_tag', status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return { passed: false, score: 0, details: { error: 'No pending meta tag verification found' } };
    }

    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { url: true },
    });
    if (!blog) {
      return { passed: false, score: 0, details: { error: 'Blog not found' } };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(blog.url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        return { passed: false, score: 0, details: { statusCode: response.status, error: 'Site unreachable' } };
      }

      const html = await response.text();
      const metaTagPattern = `<meta\\s+name=["']millionblogs-verification["']\\s+content=["']${verification.token}["']\\s*/?>`;
      const metaTagPattern2 = `<meta\\s+content=["']${verification.token}["']\\s+name=["']millionblogs-verification["']\\s*/?>`;
      const found = new RegExp(metaTagPattern, 'i').test(html) || new RegExp(metaTagPattern2, 'i').test(html);

      if (found) {
        await this.prisma.blogVerification.update({
          where: { id: verification.id },
          data: { status: 'verified', verifiedAt: new Date(), lastCheckedAt: new Date() },
        });
        return { passed: true, score: 1, details: { method: 'meta_tag', message: 'Meta tag found' } };
      }

      await this.prisma.blogVerification.update({
        where: { id: verification.id },
        data: { attemptCount: { increment: 1 }, lastCheckedAt: new Date() },
      });
      return { passed: false, score: 0, details: { method: 'meta_tag', error: 'Meta tag not found on page' } };
    } catch (err) {
      return { passed: false, score: 0, details: { method: 'meta_tag', error: (err as Error).message } };
    }
  }

  generateToken(): string {
    return uuidv4();
  }

  getMetaTagHtml(token: string): string {
    return `<meta name="millionblogs-verification" content="${token}" />`;
  }
}
