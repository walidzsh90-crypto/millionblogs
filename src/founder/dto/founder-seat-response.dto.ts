export class FounderSeatResponseDto {
  id: string;
  userId: string;
  programId: string;
  programName: string;
  badgeLabel: string;
  claimedAt: Date;
  createdAt: Date;

  static fromEntity(seat: any): FounderSeatResponseDto {
    return {
      id: seat.id,
      userId: seat.userId,
      programId: seat.programId,
      programName: seat.program?.name || '',
      badgeLabel: seat.program?.badgeLabel || '',
      claimedAt: seat.claimedAt,
      createdAt: seat.createdAt,
    };
  }
}
