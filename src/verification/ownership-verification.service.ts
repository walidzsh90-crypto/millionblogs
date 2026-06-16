import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { MetaTagStrategy } from './strategies/ownership/meta-tag.strategy';
import { DnsTxtStrategy } from './strategies/ownership/dns-txt.strategy';
import { HtmlFileStrategy } from './strategies/ownership/html-file.strategy';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OwnershipVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly metaTag: MetaTagStrategy,
    private readonly dnsTxt: DnsTxtStrategy,
    private readonly htmlFile: HtmlFileStrategy,
  ) {}

  async initiateMetaTag(blogId: string): Promise<{ token: string; metaTagHtml: string; verificationId: string }> {
    return this.initiateOwnershipVerification(blogId, 'meta_tag');
  }

  async initiateDnsTxt(blogId: string): Promise<{ token: string; txtRecordValue: string; verificationId: string }> {
    return this.initiateOwnershipVerification(blogId, 'dns_txt');
  }

  async initiateHtmlFile(blogId: string): Promise<{ token: string; fileName: string; fileContent: string; verificationId: string }> {
    return this.initiateOwnershipVerification(blogId, 'html_file');
  }

  private async initiateOwnershipVerification(blogId: string, method: string) {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, deletedAt: null },
    });
    if (!blog) throw new NotFoundException('Blog not found');

    const existing = await this.prisma.blogVerification.findFirst({
      where: { blogId, method, status: 'pending' },
    });
    if (existing) {
      throw new ConflictException(`A pending ${method} verification already exists`);
    }

    const token = this.generateTokenForMethod(method);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const verification = await this.prisma.blogVerification.create({
      data: { blogId, method, token, status: 'pending', expiresAt },
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.OWNERSHIP_VERIFICATION_INITIATED,
      aggregateId: blogId,
      aggregateType: 'blog',
      payload: { blogId, method, token, expiresAt },
      occurredAt: new Date(),
    });

    switch (method) {
      case 'meta_tag':
        return { token, metaTagHtml: this.metaTag.getMetaTagHtml(token), verificationId: verification.id };
      case 'dns_txt':
        return { token, txtRecordValue: this.dnsTxt.getTxtRecordValue(token), verificationId: verification.id };
      case 'html_file':
        return { token, fileName: this.htmlFile.getFileName(token), fileContent: this.htmlFile.getFileContent(token), verificationId: verification.id } as any;
      default:
        return { token, verificationId: verification.id };
    }
  }

  async checkOwnership(blogId: string, method: string): Promise<{ verified: boolean; details: Record<string, unknown> }> {
    let result;
    switch (method) {
      case 'meta_tag':
        result = await this.metaTag.verify(blogId);
        break;
      case 'dns_txt':
        result = await this.dnsTxt.verify(blogId);
        break;
      case 'html_file':
        result = await this.htmlFile.verify(blogId);
        break;
      default:
        throw new Error(`Unknown verification method: ${method}`);
    }

    const eventName = result.passed ? EventName.OWNERSHIP_VERIFIED : EventName.OWNERSHIP_VERIFICATION_FAILED;
    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName,
      aggregateId: blogId,
      aggregateType: 'blog',
      payload: { blogId, method, passed: result.passed, details: result.details },
      occurredAt: new Date(),
    });

    if (result.passed) {
      await this.prisma.blog.update({
        where: { id: blogId },
        data: { verifiedAt: new Date(), status: 'verified' },
      });
    }

    return { verified: result.passed, details: result.details };
  }

  async getOwnershipStatus(blogId: string): Promise<{
    metaTag: { status: string; verifiedAt?: Date } | null;
    dnsTxt: { status: string; verifiedAt?: Date } | null;
    htmlFile: { status: string; verifiedAt?: Date } | null;
  }> {
    const verifications = await this.prisma.blogVerification.findMany({
      where: { blogId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const byMethod = (method: string) => {
      const v = verifications.find((v: any) => v.method === method);
      if (!v) return null;
      return { status: v.status, verifiedAt: v.verifiedAt };
    };

    return {
      metaTag: byMethod('meta_tag'),
      dnsTxt: byMethod('dns_txt'),
      htmlFile: byMethod('html_file'),
    };
  }

  private generateTokenForMethod(method: string): string {
    switch (method) {
      case 'meta_tag': return this.metaTag.generateToken();
      case 'dns_txt': return this.dnsTxt.generateToken();
      case 'html_file': return this.htmlFile.generateToken();
      default: return uuidv4();
    }
  }
}
