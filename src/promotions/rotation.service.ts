import { Injectable } from '@nestjs/common';
import { PromotionCampaignsRepository } from './promotion-campaigns.repository';

export interface RotationResult {
  campaignId: string;
  type: string;
  targetId: string | null;
  weight: number;
  impressions: number;
  packageName: string;
}

@Injectable()
export class RotationService {
  constructor(
    private readonly campaignsRepository: PromotionCampaignsRepository,
  ) {}

  async getNext(type: 'article' | 'showcase', limit = 5): Promise<RotationResult[]> {
    const campaigns = await this.campaignsRepository.findActiveForRotation();
    const filtered = campaigns.filter((c: any) => c.type === type && c.creditsSpent < c.creditsBudget);

    if (filtered.length === 0) return [];

    const scored = filtered.map((c: any) => {
      const weight = c.weight * (c.package?.priority || 1);
      const impressionRatio = c.impressions > 0
        ? 1 / (1 + Math.log(c.impressions))
        : 1;
      const budgetRemaining = c.creditsBudget > 0
        ? (c.creditsBudget - c.creditsSpent) / c.creditsBudget
        : 1;
      const score = weight * impressionRatio * budgetRemaining;
      return { campaign: c, score };
    });

    scored.sort((a: any, b: any) => b.score - a.score);

    const selected = scored.slice(0, limit);

    return selected.map((s: any) => ({
      campaignId: s.campaign.id,
      type: s.campaign.type,
      targetId: s.campaign.targetId,
      weight: s.campaign.weight,
      impressions: s.campaign.impressions,
      packageName: s.campaign.package?.name || '',
    }));
  }

  async recordImpression(campaignId: string): Promise<void> {
    await this.campaignsRepository.recordAnalytics(campaignId, 'impression');
  }

  async recordClick(campaignId: string): Promise<void> {
    await this.campaignsRepository.recordAnalytics(campaignId, 'click');
  }
}
