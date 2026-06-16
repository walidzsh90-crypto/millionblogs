import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PlansRepository } from './plans.repository';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanFilterDto } from './dto/plan-filter.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlansService {
  constructor(
    private readonly repository: PlansRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async seedDefaultPlans(): Promise<void> {
    for (const plan of this.getDefaultPlans()) {
      const existing = await this.repository.findBySlug(plan.slug);
      if (!existing) {
        await this.repository.create(plan);
      }
    }
  }

  private getDefaultPlans() {
    return [
      {
        name: 'Free',
        slug: 'free',
        description: 'Get started with basic features',
        price: 0,
        currency: 'usd',
        visibility: 'public',
        isFree: true,
        sortOrder: 0,
        features: { maxBlogs: 1, maxArticles: 10, analytics: false, customDomain: false },
      },
      {
        name: 'Founder Pro',
        slug: 'founder-pro',
        description: 'Founder program - early adopter pro plan',
        price: 0,
        currency: 'usd',
        visibility: 'public',
        isFree: true,
        sortOrder: 1,
        features: { maxBlogs: 3, maxArticles: 100, analytics: true, customDomain: false },
      },
      {
        name: 'Founder Master',
        slug: 'founder-master',
        description: 'Founder program - early adopter master plan',
        price: 0,
        currency: 'usd',
        visibility: 'public',
        isFree: true,
        sortOrder: 2,
        features: { maxBlogs: 10, maxArticles: 1000, analytics: true, customDomain: true },
      },
      {
        name: 'Pro Monthly',
        slug: 'pro-monthly',
        description: 'Professional plan - monthly billing',
        price: 999,
        currency: 'usd',
        visibility: 'public',
        isFree: false,
        sortOrder: 3,
        features: { maxBlogs: 5, maxArticles: 500, analytics: true, customDomain: true },
      },
      {
        name: 'Pro Yearly',
        slug: 'pro-yearly',
        description: 'Professional plan - yearly billing (save 20%)',
        price: 9599,
        currency: 'usd',
        visibility: 'public',
        isFree: false,
        sortOrder: 4,
        features: { maxBlogs: 5, maxArticles: 500, analytics: true, customDomain: true },
      },
      {
        name: 'Master Monthly',
        slug: 'master-monthly',
        description: 'Master plan - monthly billing',
        price: 2999,
        currency: 'usd',
        visibility: 'public',
        isFree: false,
        sortOrder: 5,
        features: { maxBlogs: 25, maxArticles: 5000, analytics: true, customDomain: true },
      },
      {
        name: 'Master Yearly',
        slug: 'master-yearly',
        description: 'Master plan - yearly billing (save 20%)',
        price: 28799,
        currency: 'usd',
        visibility: 'public',
        isFree: false,
        sortOrder: 6,
        features: { maxBlogs: 25, maxArticles: 5000, analytics: true, customDomain: true },
      },
    ];
  }

  async create(dto: CreatePlanDto): Promise<PlanResponseDto> {
    const existing = await this.repository.findBySlug(dto.slug);
    if (existing) throw new ConflictException('A plan with this slug already exists');

    const plan = await this.repository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      price: dto.price ?? 0,
      currency: dto.currency ?? 'usd',
      visibility: dto.visibility ?? 'public',
      features: dto.features ? { list: dto.features } : undefined,
      isFree: dto.isFree ?? false,
      sortOrder: dto.sortOrder ?? 0,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PLAN_CREATED,
      aggregateId: plan.id,
      aggregateType: 'plan',
      payload: { planId: plan.id, name: plan.name, slug: plan.slug },
      occurredAt: new Date(),
    });

    return PlanResponseDto.fromEntity(plan);
  }

  async findAll(filter: PlanFilterDto) {
    const result = await this.repository.findMany(filter);
    return {
      ...result,
      items: result.items.map((item: any) => PlanResponseDto.fromEntity(item)),
    };
  }

  async findActive() {
    const plans = await this.repository.findActive();
    return plans.map((p: any) => PlanResponseDto.fromEntity(p));
  }

  async findById(id: string): Promise<PlanResponseDto> {
    const plan = await this.repository.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');
    return PlanResponseDto.fromEntity(plan);
  }

  async findBySlug(slug: string): Promise<PlanResponseDto> {
    const plan = await this.repository.findBySlug(slug);
    if (!plan) throw new NotFoundException('Plan not found');
    return PlanResponseDto.fromEntity(plan);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanResponseDto> {
    const plan = await this.repository.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.visibility !== undefined) updateData.visibility = dto.visibility;
    if (dto.features !== undefined) updateData.features = { list: dto.features };
    if (dto.limits !== undefined) updateData.limits = dto.limits;
    if (dto.isFree !== undefined) updateData.isFree = dto.isFree;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const updated = await this.repository.update(id, updateData);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PLAN_UPDATED,
      aggregateId: id,
      aggregateType: 'plan',
      payload: { planId: id, changes: Object.keys(updateData) },
      occurredAt: new Date(),
    });

    return PlanResponseDto.fromEntity(updated);
  }

  async delete(id: string): Promise<void> {
    const plan = await this.repository.findById(id);
    if (!plan) throw new NotFoundException('Plan not found');
    await this.repository.softDelete(id);
  }
}
