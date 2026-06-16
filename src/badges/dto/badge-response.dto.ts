export class BadgeResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  svgContent: string | null;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(badge: any): BadgeResponseDto {
    return {
      id: badge.id,
      name: badge.name,
      slug: badge.slug,
      description: badge.description,
      svgContent: badge.svgContent,
      type: badge.type,
      isActive: badge.isActive,
      createdAt: badge.createdAt,
      updatedAt: badge.updatedAt,
    };
  }
}
