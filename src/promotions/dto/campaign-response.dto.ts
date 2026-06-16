export class CampaignResponseDto {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  type: string;
  targetId: string | null;
  status: string;
  creditsSpent: number;
  creditsBudget: number;
  remainingCredits: number;
  weight: number;
  startDate: Date | null;
  endDate: Date | null;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(c: any): CampaignResponseDto {
    return {
      id: c.id,
      userId: c.userId,
      packageId: c.packageId,
      packageName: c.package?.name || '',
      type: c.type,
      targetId: c.targetId,
      status: c.status,
      creditsSpent: c.creditsSpent,
      creditsBudget: c.creditsBudget,
      remainingCredits: c.creditsBudget - c.creditsSpent,
      weight: c.weight,
      startDate: c.startDate,
      endDate: c.endDate,
      impressions: c.impressions,
      clicks: c.clicks,
      ctr: c.ctr,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
