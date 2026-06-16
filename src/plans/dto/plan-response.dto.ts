export class PlanResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  visibility: string;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  status: string;
  sortOrder: number;
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(plan: any): PlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      visibility: plan.visibility,
      features: plan.features as Record<string, unknown> | null,
      limits: plan.limits as Record<string, unknown> | null,
      status: plan.status,
      sortOrder: plan.sortOrder,
      isFree: plan.isFree,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
