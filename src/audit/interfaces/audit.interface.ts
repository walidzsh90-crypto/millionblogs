export interface AuditEntry {
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changeset: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditQuery {
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}
