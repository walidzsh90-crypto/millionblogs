import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BadgesService } from '../../../src/badges/badges.service';
import { BadgesRepository } from '../../../src/badges/badges.repository';
import { DomainEventPublisher } from '../../../src/events';

describe('BadgesService', () => {
  let service: BadgesService;
  let repo: jest.Mocked<BadgesRepository>;

  const mockBadge = {
    id: 'badge-1',
    name: 'Early Adopter',
    slug: 'early-adopter',
    description: 'Joined in first year',
    svgContent: '<svg>...</svg>',
    type: 'achievement',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserBadge = {
    id: 'ub-1',
    userId: 'user-1',
    badgeId: 'badge-1',
    isVisible: true,
    assignedAt: new Date(),
    revokedAt: null,
    badge: mockBadge,
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      assignBadge: jest.fn(),
      revokeBadge: jest.fn(),
      getUserBadges: jest.fn(),
      getUserVisibleBadges: jest.fn(),
      setBadgeVisibility: jest.fn(),
      findUserBadge: jest.fn(),
      getStats: jest.fn(),
    } as any;

    const eventPublisher = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        { provide: BadgesRepository, useValue: repo },
        { provide: DomainEventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
  });

  describe('createBadge', () => {
    it('should create a badge', async () => {
      repo.findBySlug.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockBadge);

      const result = await service.createBadge({ name: 'Early Adopter', slug: 'early-adopter', type: 'achievement' });
      expect(result.name).toBe('Early Adopter');
    });

    it('should reject duplicate slug', async () => {
      repo.findBySlug.mockResolvedValue(mockBadge);
      await expect(service.createBadge({ name: 'Test', slug: 'early-adopter' })).rejects.toThrow(ConflictException);
    });
  });

  describe('assignBadgeToUser', () => {
    it('should assign badge to user', async () => {
      repo.findById.mockResolvedValue(mockBadge);
      repo.assignBadge.mockResolvedValue(mockUserBadge);

      const result = await service.assignBadgeToUser('user-1', 'badge-1');
      expect(result.badgeId).toBe('badge-1');
    });

    it('should reject if badge not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.assignBadgeToUser('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setBadgeVisibility', () => {
    it('should toggle visibility', async () => {
      repo.findUserBadge.mockResolvedValue(mockUserBadge);
      repo.setBadgeVisibility.mockResolvedValue({ ...mockUserBadge, isVisible: false });

      const result = await service.setBadgeVisibility('user-1', 'badge-1', false);
      expect(result.isVisible).toBe(false);
    });

    it('should reject if badge not assigned', async () => {
      repo.findUserBadge.mockResolvedValue(null);
      await expect(service.setBadgeVisibility('user-1', 'badge-1', false)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyBadges', () => {
    it('should return user badges', async () => {
      repo.getUserBadges.mockResolvedValue([mockUserBadge]);

      const result = await service.getMyBadges('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].badgeName).toBe('Early Adopter');
    });
  });
});
