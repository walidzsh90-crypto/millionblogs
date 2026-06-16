import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupportService } from '../../../src/support/support.service';
import { SupportTicketsRepository } from '../../../src/support/support-tickets.repository';
import { DomainEventPublisher } from '../../../src/events';

describe('SupportService', () => {
  let service: SupportService;
  let repo: jest.Mocked<SupportTicketsRepository>;

  const mockTicket = {
    id: 'ticket-1',
    userId: 'user-1',
    subject: 'Need help',
    body: 'How do I promote my article?',
    status: 'open',
    assignedTo: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', displayName: 'Test User', email: 'user@test.com' },
    replies: [],
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      addReply: jest.fn(),
      getStats: jest.fn(),
    } as any;

    const eventPublisher = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: SupportTicketsRepository, useValue: repo },
        { provide: DomainEventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  describe('createTicket', () => {
    it('should create a ticket', async () => {
      repo.create.mockResolvedValue(mockTicket);

      const result = await service.createTicket('user-1', 'Need help', 'How do I promote my article?');
      expect(result.subject).toBe('Need help');
      expect(result.status).toBe('open');
    });
  });

  describe('getTicket', () => {
    it('should return ticket for owner', async () => {
      repo.findById.mockResolvedValue(mockTicket);

      const result = await service.getTicket('ticket-1', 'user-1');
      expect(result.id).toBe('ticket-1');
    });

    it('should reject if ticket not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getTicket('invalid', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should reject if userId mismatched', async () => {
      repo.findById.mockResolvedValue(mockTicket);
      await expect(service.getTicket('ticket-1', 'other-user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addReply', () => {
    it('should add reply to open ticket', async () => {
      repo.findById.mockResolvedValue(mockTicket);
      repo.addReply.mockResolvedValue({ id: 'reply-1', body: 'Thanks!', createdAt: new Date(), userId: 'user-1', ticketId: 'ticket-1' });
      repo.update.mockResolvedValue(mockTicket);

      const result = await service.addReply('ticket-1', 'user-1', 'Thanks!');
      expect(result.id).toBe('reply-1');
    });

    it('should reject reply to closed ticket', async () => {
      repo.findById.mockResolvedValue({ ...mockTicket, status: 'closed' });
      await expect(service.addReply('ticket-1', 'user-1', 'Thanks!')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeStatus', () => {
    it('should change ticket status', async () => {
      repo.findById.mockResolvedValue(mockTicket);
      repo.update.mockResolvedValue({ ...mockTicket, status: 'closed', closedAt: new Date() });

      const result = await service.changeStatus('ticket-1', 'closed');
      expect(result.status).toBe('closed');
    });

    it('should reject if ticket not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.changeStatus('invalid', 'closed')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignTicket', () => {
    it('should assign ticket to admin', async () => {
      repo.findById.mockResolvedValue(mockTicket);
      repo.update.mockResolvedValue({ ...mockTicket, assignedTo: 'admin-1' });

      const result = await service.assignTicket('ticket-1', 'admin-1');
      expect(result.assignedTo).toBe('admin-1');
    });
  });
});
