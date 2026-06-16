export class FounderProgramResponseDto {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  totalSeats: number;
  usedSeats: number;
  remainingSeats: number;
  status: string;
  badgeLabel: string;
  benefits: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(program: any): FounderProgramResponseDto {
    return {
      id: program.id,
      slug: program.slug,
      name: program.name,
      price: program.price,
      currency: program.currency,
      totalSeats: program.totalSeats,
      usedSeats: program.usedSeats,
      remainingSeats: program.totalSeats - program.usedSeats,
      status: program.status,
      badgeLabel: program.badgeLabel,
      benefits: program.benefits as Record<string, unknown> | null,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }
}
