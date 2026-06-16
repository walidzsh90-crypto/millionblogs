export class UserBadgeResponseDto {
  id: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  badgeSlug: string;
  badgeType: string;
  svgContent: string | null;
  isVisible: boolean;
  assignedAt: Date;

  static fromEntity(ub: any): UserBadgeResponseDto {
    return {
      id: ub.id,
      userId: ub.userId,
      badgeId: ub.badgeId,
      badgeName: ub.badge?.name || '',
      badgeSlug: ub.badge?.slug || '',
      badgeType: ub.badge?.type || '',
      svgContent: ub.badge?.svgContent || null,
      isVisible: ub.isVisible,
      assignedAt: ub.assignedAt,
    };
  }
}
