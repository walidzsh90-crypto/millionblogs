import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async create(userId: string, type: string, title: string, body?: string, data?: Record<string, unknown>) {
    const notification = await this.notificationsRepository.create({ userId, type, title, body, data });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.NOTIFICATION_CREATED,
      aggregateId: notification.id,
      aggregateType: 'notification',
      payload: { notificationId: notification.id, userId, type, title },
      occurredAt: new Date(),
    });

    return NotificationResponseDto.fromEntity(notification);
  }

  async getMyNotifications(userId: string, filter: NotificationFilterDto) {
    const result = await this.notificationsRepository.findByUserId(userId, filter);
    return {
      ...result,
      items: result.items.map((n: any) => NotificationResponseDto.fromEntity(n)),
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationsRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) throw new NotFoundException('Notification not found');

    const updated = await this.notificationsRepository.markAsRead(notificationId);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.NOTIFICATION_READ,
      aggregateId: notificationId,
      aggregateType: 'notification',
      payload: { notificationId, userId },
      occurredAt: new Date(),
    });

    return NotificationResponseDto.fromEntity(updated);
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.markAllAsRead(userId);
  }

  async archive(notificationId: string, userId: string) {
    const notification = await this.notificationsRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) throw new NotFoundException('Notification not found');

    const updated = await this.notificationsRepository.archive(notificationId);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.NOTIFICATION_ARCHIVED,
      aggregateId: notificationId,
      aggregateType: 'notification',
      payload: { notificationId, userId },
      occurredAt: new Date(),
    });

    return NotificationResponseDto.fromEntity(updated);
  }

  async delete(notificationId: string, userId: string) {
    const notification = await this.notificationsRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) throw new NotFoundException('Notification not found');

    await this.notificationsRepository.delete(notificationId);
    return { deleted: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationsRepository.getUnreadCount(userId);
    return { count };
  }
}
