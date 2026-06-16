import { Injectable, Logger } from '@nestjs/common';
import { BaseVerificationStrategy, VerificationResult } from '../base.strategy';
import { PrismaService } from '../../../prisma';
import { v4 as uuidv4 } from 'uuid';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

@Injectable()
export class DnsTxtStrategy extends BaseVerificationStrategy {
  name = 'dns_txt';
  weight = 0;

  private readonly logger = new Logger(DnsTxtStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async verify(blogId: string): Promise<VerificationResult> {
    const verification = await this.prisma.blogVerification.findFirst({
      where: { blogId, method: 'dns_txt', status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return { passed: false, score: 0, details: { error: 'No pending DNS TXT verification found' } };
    }

    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
      select: { url: true },
    });
    if (!blog) {
      return { passed: false, score: 0, details: { error: 'Blog not found' } };
    }

    const domain = this.extractDomain(blog.url);
    if (!domain) {
      return { passed: false, score: 0, details: { error: 'Could not extract domain from URL' } };
    }

    try {
      const records = await resolveTxt(domain);
      const txtStrings = records.flat();
      const expected = `millionblogs-verification=${verification.token}`;
      const found = txtStrings.some((txt) => txt.includes(expected));

      if (found) {
        await this.prisma.blogVerification.update({
          where: { id: verification.id },
          data: { status: 'verified', verifiedAt: new Date(), lastCheckedAt: new Date() },
        });
        return { passed: true, score: 1, details: { method: 'dns_txt', domain, message: 'TXT record found' } };
      }

      await this.prisma.blogVerification.update({
        where: { id: verification.id },
        data: { attemptCount: { increment: 1 }, lastCheckedAt: new Date() },
      });
      return { passed: false, score: 0, details: { method: 'dns_txt', domain, error: 'TXT record not found' } };
    } catch (err) {
      this.logger.error(`DNS TXT lookup failed for ${domain}`, err);
      return { passed: false, score: 0, details: { method: 'dns_txt', domain, error: (err as Error).message } };
    }
  }

  generateToken(): string {
    return uuidv4();
  }

  getTxtRecordValue(token: string): string {
    return `millionblogs-verification=${token}`;
  }

  private extractDomain(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return null;
    }
  }
}
