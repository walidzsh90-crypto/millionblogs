import { Injectable, Logger } from '@nestjs/common';
import { BaseVerificationStrategy, VerificationResult } from '../base.strategy';
import { PrismaService } from '../../../prisma';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HtmlFileStrategy extends BaseVerificationStrategy {
  name = 'html_file';
  weight = 0;

  private readonly logger = new Logger(HtmlFileStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verify(blogId: string): Promise<VerificationResult> {
    const verification = await this.prisma.blogVerification.findFirst({
      where: { blogId, method: 'html_file', status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return { passed: false, score: 0, details: { error: 'No pending HTML file verification found' } };
    }

    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { url: true },
    });
    if (!blog) {
      return { passed: false, score: 0, details: { error: 'Blog not found' } };
    }

    const fileName = `millionblogs-${verification.token}.html`;
    const fileUrl = `${blog.url.replace(/\/+$/, '')}/${fileName}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(fileUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        await this.prisma.blogVerification.update({
          where: { id: verification.id },
          data: { attemptCount: { increment: 1 }, lastCheckedAt: new Date() },
        });
        return {
          passed: false,
          score: 0,
          details: { method: 'html_file', statusCode: response.status, fileName, error: 'File not found' },
        };
      }

      const content = await response.text();
      const expectedContent = `millionblogs-verification: ${verification.token}`;
      const found = content.trim() === expectedContent || content.includes(expectedContent);

      if (found) {
        await this.prisma.blogVerification.update({
          where: { id: verification.id },
          data: { status: 'verified', verifiedAt: new Date(), lastCheckedAt: new Date() },
        });
        return { passed: true, score: 1, details: { method: 'html_file', fileName, message: 'Verification file found' } };
      }

      await this.prisma.blogVerification.update({
        where: { id: verification.id },
        data: { attemptCount: { increment: 1 }, lastCheckedAt: new Date() },
      });
      return { passed: false, score: 0, details: { method: 'html_file', fileName, error: 'File content does not match' } };
    } catch (err) {
      this.logger.error(`HTML file verification failed for ${fileUrl}`, err);
      return { passed: false, score: 0, details: { method: 'html_file', fileName, error: (err as Error).message } };
    }
  }

  generateToken(): string {
    return uuidv4();
  }

  getFileName(token: string): string {
    return `millionblogs-${token}.html`;
  }

  getFileContent(token: string): string {
    return `millionblogs-verification: ${token}`;
  }
}
