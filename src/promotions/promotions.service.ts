import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PromotionPackagesRepository } from './promotion-packages.repository';
import { PromotionCampaignsRepository } from './promotion-campaigns.repository';
import { RotationService } from './rotation.service';
import { WalletService } from '../wallet/wallet.service';
import { FeatureAccessService } from '../feature-access/feature-access.service';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';
import { PackageResponseDto } from './dto/package-response.dto';
import { CampaignResponseDto } from './dto/campaign-response.dto';
import { CampaignFilterDto } from './dto/campaign-filter.dto';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly packagesRepository: PromotionPackagesRepository,
    private readonly campaignsRepository: PromotionCampaignsRepository,
    private readonly rotationService: RotationService,
    private readonly walletService: WalletService,
    private readonly featureAccessService: FeatureAccessService,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // ─── Packages ───

  async getPackages() {
    const packages = await this.packagesRepository.findAllActive();
    return packages.map((p: any) => PackageResponseDto.fromEntity(p));
  }

  async getAllPackages() {
    const packages = await this.packagesRepository.findAll();
    return packages.map((p: any) => PackageResponseDto.fromEntity(p));
  }

  async getPackage(id: string) {
    const pkg = await this.packagesRepository.findById(id);
    if (!pkg) throw new NotFoundException('Promotion package not found');
    return PackageResponseDto.fromEntity(pkg);
  }

  async createPackage(dto: any) {
    const existing = await this.packagesRepository.findBySlug(dto.slug);
    if (existing) throw new ConflictException('Package slug already exists');

    const pkg = await this.packagesRepository.create(dto);
    return PackageResponseDto.fromEntity(pkg);
  }

  async updatePackage(id: string, dto: any) {
    const pkg = await this.packagesRepository.findById(id);
    if (!pkg) throw new NotFoundException('Package not found');

    const updated = await this.packagesRepository.update(id, dto);
    return PackageResponseDto.fromEntity(updated);
  }

  async deletePackage(id: string) {
    const pkg = await this.packagesRepository.findById(id);
    if (!pkg) throw new NotFoundException('Package not found');

    await this.packagesRepository.delete(id);
    return { deleted: true };
  }

  // ─── Campaigns ───

  async createCampaign(userId: string, dto: any) {
    const pkg = await this.packagesRepository.findById(dto.packageId);
    if (!pkg) throw new NotFoundException('Promotion package not found');
    if (pkg.status !== 'active') throw new BadRequestException('Package is not active');

    const access = await this.featureAccessService.resolve(userId);
    if (!access.features.includes('promotions')) {
      throw new ForbiddenException('Your plan does not include promotions');
    }

    const creditsBudget = dto.creditsBudget || pkg.creditCost;
    const idempotencyKey = `promo_campaign_${userId}_${dto.packageId}_${dto.type}`;

    await this.consumeCredits(userId, creditsBudget, idempotencyKey);

    const campaign = await this.campaignsRepository.create({
      userId,
      packageId: dto.packageId,
      type: dto.type,
      targetId: dto.targetId,
      status: 'draft',
      creditsBudget,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.CAMPAIGN_CREATED,
      aggregateId: campaign.id,
      aggregateType: 'promotion_campaign',
      payload: { campaignId: campaign.id, userId, type: dto.type, creditsBudget },
      occurredAt: new Date(),
    });

    return CampaignResponseDto.fromEntity(campaign);
  }

  async activateCampaign(campaignId: string) {
    const campaign = await this.campaignsRepository.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new BadRequestException(`Cannot activate campaign in status: ${campaign.status}`);
    }

    const now = new Date();
    const endDate = campaign.endDate || new Date(now.getTime() + (campaign.package?.duration || 86400) * 1000);

    const updated = await this.campaignsRepository.update(campaignId, {
      status: 'active',
      startDate: campaign.startDate || now,
      endDate,
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.CAMPAIGN_ACTIVATED,
      aggregateId: campaignId,
      aggregateType: 'promotion_campaign',
      payload: { campaignId, userId: campaign.userId },
      occurredAt: new Date(),
    });

    return CampaignResponseDto.fromEntity(updated);
  }

  async pauseCampaign(campaignId: string) {
    const campaign = await this.campaignsRepository.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'active') throw new BadRequestException('Campaign is not active');

    const updated = await this.campaignsRepository.update(campaignId, { status: 'paused' });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.CAMPAIGN_PAUSED,
      aggregateId: campaignId,
      aggregateType: 'promotion_campaign',
      payload: { campaignId, userId: campaign.userId },
      occurredAt: new Date(),
    });

    return CampaignResponseDto.fromEntity(updated);
  }

  async completeCampaign(campaignId: string) {
    const campaign = await this.campaignsRepository.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    const updated = await this.campaignsRepository.update(campaignId, { status: 'completed' });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.CAMPAIGN_COMPLETED,
      aggregateId: campaignId,
      aggregateType: 'promotion_campaign',
      payload: { campaignId, userId: campaign.userId },
      occurredAt: new Date(),
    });

    return CampaignResponseDto.fromEntity(updated);
  }

  async cancelCampaign(campaignId: string) {
    const campaign = await this.campaignsRepository.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    const updated = await this.campaignsRepository.update(campaignId, { status: 'cancelled' });
    return CampaignResponseDto.fromEntity(updated);
  }

  async getUserCampaigns(userId: string, filter: CampaignFilterDto) {
    const result = await this.campaignsRepository.findByUserId(userId, filter);
    return {
      ...result,
      items: result.items.map((c: any) => CampaignResponseDto.fromEntity(c)),
    };
  }

  async getCampaign(id: string) {
    const campaign = await this.campaignsRepository.findById(id);
    if (!campaign) throw new NotFoundException('Campaign not found');
    return CampaignResponseDto.fromEntity(campaign);
  }

  async getAllCampaigns(filter: CampaignFilterDto) {
    const result = await this.campaignsRepository.findAll(filter);
    return {
      ...result,
      items: result.items.map((c: any) => CampaignResponseDto.fromEntity(c)),
    };
  }

  async getRotation(type: 'article' | 'showcase', limit = 5) {
    return this.rotationService.getNext(type, limit);
  }

  async recordImpression(campaignId: string) {
    await this.rotationService.recordImpression(campaignId);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PROMOTION_VIEWED,
      aggregateId: campaignId,
      aggregateType: 'promotion_campaign',
      payload: { campaignId },
      occurredAt: new Date(),
    });

    return { recorded: true };
  }

  async recordClick(campaignId: string) {
    await this.rotationService.recordClick(campaignId);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.PROMOTION_CLICKED,
      aggregateId: campaignId,
      aggregateType: 'promotion_campaign',
      payload: { campaignId },
      occurredAt: new Date(),
    });

    return { recorded: true };
  }

  async getStats() {
    return this.campaignsRepository.getStats();
  }

  async expireCampaigns() {
    const now = new Date();
    const filter = new CampaignFilterDto();
    filter.status = 'active';
    const result = await this.campaignsRepository.findAll(filter);

    let expired = 0;
    for (const campaign of result.items) {
      if (campaign.endDate && campaign.endDate <= now) {
        await this.campaignsRepository.update(campaign.id, { status: 'expired' });

        await this.eventPublisher.publish({
          eventId: uuidv4(),
          eventName: EventName.CAMPAIGN_EXPIRED,
          aggregateId: campaign.id,
          aggregateType: 'promotion_campaign',
          payload: { campaignId: campaign.id },
          occurredAt: new Date(),
        });

        expired++;
      }
    }

    return { expired };
  }

  private async consumeCredits(userId: string, amount: number, idempotencyKey: string) {
    const balance = await this.walletService.getBalance(userId);
    if (balance.totalBalance < amount) {
      throw new BadRequestException('Insufficient credits');
    }

    await this.walletService.debit(userId, amount, 'Promotion campaign purchase', idempotencyKey, idempotencyKey);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.CREDITS_CONSUMED,
      aggregateId: userId,
      aggregateType: 'wallet',
      payload: { userId, amount, source: 'promotion' },
      occurredAt: new Date(),
    });
  }
}
