import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { BlogsRepository } from './blogs.repository';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogFilterDto } from './dto/blog-filter.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { AuditService } from '../audit';
import { ActivityService } from '../activity';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';

const RESERVED_SLUGS = [
  'admin', 'api', 'auth', 'blog', 'blogs', 'category', 'dashboard',
  'help', 'home', 'login', 'logout', 'manage', 'profile', 'register',
  'search', 'settings', 'support', 'terms', 'privacy', 'about', 'contact',
  'verification', 'verify', 'www', 'mail', 'email', 'status', 'health',
];

@Injectable()
export class BlogsService {

  constructor(
    private readonly repository: BlogsRepository,
    private readonly audit: AuditService,
    private readonly activity: ActivityService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async create(userId: string, dto: CreateBlogDto): Promise<BlogResponseDto> {
    const existingUrl = await this.repository.findByUrl(dto.url);
    if (existingUrl) {
      throw new ConflictException('A blog with this URL already exists');
    }

    const slug = await this.generateSlug(dto.name);

    const blog = await this.repository.create({
      userId,
      name: dto.name,
      slug,
      url: dto.url,
      description: dto.description,
      primaryLanguage: dto.primaryLanguage,
      status: 'draft',
      trustStatus: 'new',
    });

    if (dto.categoryIds?.length) {
      await this.repository.setCategories(blog.id, dto.categoryIds);
    }

    if (dto.additionalLanguages?.length) {
      await this.repository.setLanguages(blog.id, dto.additionalLanguages);
    }

    await this.activity.record({
      actorId: userId,
      type: 'blog.created',
      resource: 'blog',
      resourceId: blog.id,
      context: { name: dto.name, url: dto.url },
      metadata: null,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BLOG_CREATED,
      aggregateId: blog.id,
      aggregateType: 'blog',
      payload: { blogId: blog.id, userId, name: dto.name, url: dto.url },
      occurredAt: new Date(),
    });

    return this.buildResponse(blog);
  }

  async findById(id: string): Promise<BlogResponseDto> {
    const blog = await this.repository.findById(id);
    if (!blog) throw new NotFoundException('Blog not found');
    return this.buildResponse(blog);
  }

  async findBySlug(slug: string): Promise<BlogResponseDto> {
    const blog = await this.repository.findBySlug(slug);
    if (!blog) throw new NotFoundException('Blog not found');
    return this.buildResponse(blog);
  }

  async findByUser(userId: string): Promise<BlogResponseDto[]> {
    const blogs = await this.repository.findByUserId(userId);
    return blogs.map((b: any) => this.buildResponse(b));
  }

  async update(userId: string, blogId: string, dto: UpdateBlogDto): Promise<BlogResponseDto> {
    const blog = await this.repository.findById(blogId);
    if (!blog) throw new NotFoundException('Blog not found');
    if (blog.userId !== userId) throw new ForbiddenException('You do not own this blog');

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.url !== undefined) updateData.url = dto.url;
    if (dto.primaryLanguage !== undefined) updateData.primaryLanguage = dto.primaryLanguage;
    if (dto.visibility !== undefined) updateData.visibility = dto.visibility;

    if (dto.categoryIds !== undefined) {
      await this.repository.setCategories(blogId, dto.categoryIds);
    }
    if (dto.additionalLanguages !== undefined) {
      await this.repository.setLanguages(blogId, dto.additionalLanguages);
    }

    const updated = await this.repository.update(blogId, updateData);

    await this.activity.record({
      actorId: userId,
      type: 'blog.updated',
      resource: 'blog',
      resourceId: blogId,
      context: dto as any,
      metadata: null,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BLOG_UPDATED,
      aggregateId: blogId,
      aggregateType: 'blog',
      payload: { blogId, userId },
      occurredAt: new Date(),
    });

    return this.buildResponse(updated);
  }

  async softDelete(userId: string, blogId: string): Promise<void> {
    const blog = await this.repository.findById(blogId);
    if (!blog) throw new NotFoundException('Blog not found');
    if (blog.userId !== userId) throw new ForbiddenException('You do not own this blog');

    await this.repository.softDelete(blogId);

    await this.audit.record({
      actorId: userId,
      action: 'blog.deleted',
      resourceType: 'blog',
      resourceId: blogId,
      changeset: null,
      ipAddress: null,
      userAgent: null,
      metadata: null,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.BLOG_DELETED,
      aggregateId: blogId,
      aggregateType: 'blog',
      payload: { blogId, userId },
      occurredAt: new Date(),
    });
  }

  async list(filter: BlogFilterDto) {
    const result = await this.repository.findMany(filter);
    return {
      ...result,
      items: result.items.map((item: any) => this.buildResponse(item)),
    };
  }

  async getStats() {
    const [draft, pending, verified, rejected, suspended] = await Promise.all([
      this.repository.countByStatus('draft'),
      this.repository.countByStatus('pending_verification'),
      this.repository.countByStatus('verified'),
      this.repository.countByStatus('rejected'),
      this.repository.countByStatus('suspended'),
    ]);
    return { draft, pendingVerification: pending, verified, rejected, suspended };
  }

  private async generateSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) slug = `blog-${uuidv4().slice(0, 8)}`;

    if (RESERVED_SLUGS.includes(slug)) {
      slug = `${slug}-${uuidv4().slice(0, 6)}`;
    }

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${uuidv4().slice(0, 6)}`;
    }

    return slug;
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
