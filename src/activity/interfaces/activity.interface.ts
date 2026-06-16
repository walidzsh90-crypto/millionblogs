export interface ActivityEntry {
  actorId: string | null;
  type: string;
  resource: string;
  resourceId: string | null;
  context: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}
