import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionsRepository } from './sessions.repository';
import { DomainEventPublisher } from '../events';
import { AuditService } from '../audit';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionsService {
  constructor(
    private readonly repository: SessionsRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly audit: AuditService,
  ) {}

  async getUserSessions(userId: string) {
    return this.repository.findActiveByUserId(userId);
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const sessions = await this.repository.findActiveByUserId(userId);
    const session = sessions.find((s: any) => s.id === sessionId);
    if (!session) throw new NotFoundException('Session not found');

    await this.repository.revoke(sessionId);

    await this.audit.record({
      actorId: userId,
      action: 'session.revoked',
      resourceType: 'session',
      resourceId: sessionId,
      changeset: null,
      ipAddress: null,
      userAgent: null,
      metadata: { userId },
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.SESSION_REVOKED,
      aggregateId: sessionId,
      aggregateType: 'session',
      payload: { userId, sessionId },
      occurredAt: new Date(),
    });
  }

  async revokeAllSessions(userId: string, excludeSessionId?: string): Promise<number> {
    const result = await this.repository.revokeAllByUserId(userId, excludeSessionId);

    await this.audit.record({
      actorId: userId,
      action: 'session.revoked_all',
      resourceType: 'user',
      resourceId: userId,
      changeset: null,
      ipAddress: null,
      userAgent: null,
      metadata: { excludeSessionId },
    });

    return result.count;
  }
}
