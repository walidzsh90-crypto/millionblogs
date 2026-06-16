import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../src/notifications/notifications.service';
import { NotificationsRepository } from '../../../src/notifications/notifications.repository';
import { DomainEventPublisher } from '../../../src/events';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: jest.Mocked<NotificationsRepository>;

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'system',
    title: 'Welcome!',
    body: 'Thanks for joining',
    data: null,
    readAt: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      archive: jest.fn(),
      delete: jest.fn(),
      getUnreadCount: jest.fn(),
    } as any;

    const eventPublisher = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: repo },
        { provide: DomainEventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      repo.create.mockResolvedValue(mockNotification);

      const result = await service.create('user-1', 'system', 'Welcome!', 'Thanks for joining');
      expect(result.title).toBe('Welcome!');
      expect(result.type).toBe('system');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      repo.findById.mockResolvedValue(mockNotification);
      repo.markAsRead.mockResolvedValue({ ...mockNotification, readAt: new Date() });

      const result = await service.markAsRead('notif-1', 'user-1');
      expect(result.isRead).toBe(true);
    });

    it('should reject if notification not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.markAsRead('invalid', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should reject if notification belongs to different user', async () => {
      repo.findById.mockResolvedValue(mockNotification);
      await expect(service.markAsRead('notif-1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', async () => {
      repo.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');
      expect(result.count).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      repo.getUnreadCount.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');
      expect(result.count).toBe(3);
    });
  });
});
