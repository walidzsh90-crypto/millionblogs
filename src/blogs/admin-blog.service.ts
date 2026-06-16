import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';
import { AuditService } from '../audit';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { AdminUpdateBlogDto } from './dto/admin-update-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminBlogService {
  constructor(
    private readonly repository: BlogsRepository,
    private readonly audit: AuditService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async adminUpdate(id: string, dto: AdminUpdateBlogDto): Promise<BlogResponseDto> {
    const blog = await this.repository.findById(id);
    if (!blog) throw new NotFoundException('Blog not found');

    const updateData: Record<string, unknown> = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.trustStatus) updateData.trustStatus = dto.trustStatus;

    const updated = await this.repository.update(id, updateData);

    if (dto.status === 'verified') {
      updateData.verifiedAt = new Date();
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.BLOG_VERIFIED,
        aggregateId: id,
        aggregateType: 'blog',
        payload: { blogId: id, userId: blog.userId },
        occurredAt: new Date(),
      });
    }

    if (dto.status === 'rejected') {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.BLOG_REJECTED,
        aggregateId: id,
        aggregateType: 'blog',
        payload: { blogId: id, reason: dto.rejectionReason },
        occurredAt: new Date(),
      });
    }

    if (dto.status === 'suspended') {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.BLOG_SUSPENDED,
        aggregateId: id,
        aggregateType: 'blog',
        payload: { blogId: id },
        occurredAt: new Date(),
      });
    }

    if (dto.trustStatus) {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.BLOG_TRUST_CHANGED,
        aggregateId: id,
        aggregateType: 'blog',
        payload: { blogId: id, trustStatus: dto.trustStatus },
        occurredAt: new Date(),
      });
    }

    await this.audit.record({
      actorId: 'admin',
      action: 'blog.admin_updated',
      resourceType: 'blog',
      resourceId: id,
      changeset: dto as any,
      ipAddress: null,
      userAgent: null,
      metadata: null,
    });

    return this.buildResponse(updated);
  }

  async adminRestore(id: string): Promise<BlogResponseDto> {
    const blog = await this.repository.findById(id);
    if (!blog) throw new NotFoundException('Blog not found');

    const restored = await this.repository.restore(id);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BLOG_RESTORED,
      aggregateId: id,
      aggregateType: 'blog',
      payload: { blogId: id },
      occurredAt: new Date(),
    });

    return this.buildResponse(restored);
  }

  async transferOwnership(blogId: string, newOwnerId: string): Promise<BlogResponseDto> {
    const blog = await this.repository.findById(blogId);
    if (!blog) throw new NotFoundException('Blog not found');

    const updated = await this.repository.update(blogId, { userId: newOwnerId });

    await this.audit.record({
      actorId: 'admin',
      action: 'blog.ownership_transferred',
      resourceType: 'blog',
      resourceId: blogId,
      changeset: { fromUserId: blog.userId, toUserId: newOwnerId },
      ipAddress: null,
      userAgent: null,
      metadata: null,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.OWNERSHIP_TRANSFERRED,
      aggregateId: blogId,
      aggregateType: 'blog',
      payload: { blogId, fromUserId: blog.userId, toUserId: newOwnerId },
      occurredAt: new Date(),
    });

    return this.buildResponse(updated);
  }

  private buildResponse(blog: any): BlogResponseDto {
    const categories = blog.categories?.map((bc: any) => ({
      id: bc.category.id,
      slug: bc.category.slug,
      name: bc.category.name,
    })) || [];
    const additionalLanguages = blog.languages?.map((l: any) => l.language) || [];
    return BlogResponseDto.fromEntity(blog, categories, additionalLanguages);
  }
}
