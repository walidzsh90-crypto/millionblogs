export class NotificationResponseDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  isArchived: boolean;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;

  static fromEntity(n: any): NotificationResponseDto {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data as Record<string, unknown> | null,
      isRead: !!n.readAt,
      isArchived: !!n.archivedAt,
      readAt: n.readAt,
      archivedAt: n.archivedAt,
      createdAt: n.createdAt,
    };
  }
}
