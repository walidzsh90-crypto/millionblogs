export class PackageResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  creditCost: number;
  duration: number;
  priority: number;
  status: string;
  visibility: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(pkg: any): PackageResponseDto {
    return {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      creditCost: pkg.creditCost,
      duration: pkg.duration,
      priority: pkg.priority,
      status: pkg.status,
      visibility: pkg.visibility,
      sortOrder: pkg.sortOrder,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}
