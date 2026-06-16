export class TicketResponseDto {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  body: string | null;
  status: string;
  assignedTo: string | null;
  replyCount: number;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(t: any): TicketResponseDto {
    return {
      id: t.id,
      userId: t.userId,
      userName: t.user?.displayName || '',
      subject: t.subject,
      body: t.body,
      status: t.status,
      assignedTo: t.assignedTo,
      replyCount: t.replies?.length || 0,
      closedAt: t.closedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}
