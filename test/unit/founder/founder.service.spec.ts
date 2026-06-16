import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { FounderService } from '../../../src/founder/founder.service';
import { FounderRepository } from '../../../src/founder/founder.repository';
import { DomainEventPublisher } from '../../../src/events';

describe('FounderService', () => {
  let service: FounderService;
  let repository: jest.Mocked<FounderRepository>;

  const mockProgram = {
    id: 'prog-1',
    slug: 'founder-pro',
    name: 'Founder Pro',
    price: 1595,
    currency: 'usd',
    totalSeats: 5000,
    usedSeats: 100,
    status: 'open',
    badgeLabel: 'Founder Pro',
    benefits: { lifetimeAccess: true, proFeatures: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMasterProgram = {
    id: 'prog-2',
    slug: 'founder-master',
    name: 'Founder Master',
    price: 5000,
    currency: 'usd',
    totalSeats: 1000,
    usedSeats: 50,
    status: 'open',
    badgeLabel: 'Founder Master',
    benefits: { lifetimeAccess: true, masterFeatures: true, welcomeCredits: true },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSeat = {
    id: 'seat-1',
    userId: 'user-1',
    programId: 'prog-1',
    version: 1,
    claimedAt: new Date(),
    createdAt: new Date(),
    program: mockProgram,
  };

  const mockMasterSeat = {
    id: 'seat-2',
    userId: 'user-1',
    programId: 'prog-2',
    version: 1,
    claimedAt: new Date(),
    createdAt: new Date(),
    program: mockMasterProgram,
  };

  beforeEach(async () => {
    repository = {
      findProgramById: jest.fn(),
      findProgramBySlug: jest.fn(),
      findOpenPrograms: jest.fn(),
      findAllPrograms: jest.fn(),
      getSeatByUserId: jest.fn(),
      getSeatById: jest.fn(),
      getSeatsByProgramId: jest.fn(),
      getAllSeats: jest.fn(),
      claimSeatAtomic: jest.fn(),
      upgradeSeatAtomic: jest.fn(),
      closeProgram: jest.fn(),
      updateProgram: jest.fn(),
      seedDefaultPrograms: jest.fn(),
    } as any;

    const eventPublisher = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FounderService,
        { provide: FounderRepository, useValue: repository },
        { provide: DomainEventPublisher, useValue: eventPublisher },
      ],
    }).compile();

    service = module.get<FounderService>(FounderService);
  });

  describe('getPrograms', () => {
    it('should return open programs', async () => {
      repository.findOpenPrograms.mockResolvedValue([mockProgram, mockMasterProgram]);
      const result = await service.getPrograms();
      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('founder-pro');
    });
  });

  describe('claimSeat', () => {
    it('should claim a seat successfully', async () => {
      repository.findProgramById.mockResolvedValue(mockProgram);
      repository.getSeatByUserId.mockResolvedValue(null);
      repository.claimSeatAtomic.mockResolvedValue({ success: true, seat: mockSeat });

      const result = await service.claimSeat('user-1', 'prog-1');
      expect(result.id).toBe('seat-1');
    });

    it('should reject if program not found', async () => {
      repository.findProgramById.mockResolvedValue(null);
      await expect(service.claimSeat('user-1', 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should reject if program is closed', async () => {
      repository.findProgramById.mockResolvedValue({ ...mockProgram, status: 'closed' });
      await expect(service.claimSeat('user-1', 'prog-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject if no seats available', async () => {
      repository.findProgramById.mockResolvedValue({ ...mockProgram, usedSeats: 5000, totalSeats: 5000 });
      await expect(service.claimSeat('user-1', 'prog-1')).rejects.toThrow(ConflictException);
    });

    it('should reject if user already has seat', async () => {
      repository.findProgramById.mockResolvedValue(mockProgram);
      repository.getSeatByUserId.mockResolvedValue(mockSeat);
      await expect(service.claimSeat('user-1', 'prog-1')).rejects.toThrow(ConflictException);
    });

    it('should reject if atomic claim fails', async () => {
      repository.findProgramById.mockResolvedValue(mockProgram);
      repository.getSeatByUserId.mockResolvedValue(null);
      repository.claimSeatAtomic.mockResolvedValue({ success: false, error: 'No seats available' });
      await expect(service.claimSeat('user-1', 'prog-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('upgradeSeat', () => {
    it('should upgrade from Pro to Master', async () => {
      repository.getSeatByUserId.mockResolvedValue(mockSeat);
      repository.findProgramById.mockResolvedValue(mockMasterProgram);
      repository.upgradeSeatAtomic.mockResolvedValue({ success: true, seat: mockMasterSeat });

      const result = await service.upgradeSeat('user-1', 'prog-2');
      expect(result.id).toBe('seat-2');
    });

    it('should reject if user has no seat', async () => {
      repository.getSeatByUserId.mockResolvedValue(null);
      await expect(service.upgradeSeat('user-1', 'prog-2')).rejects.toThrow(BadRequestException);
    });

    it('should reject if target program not found', async () => {
      repository.getSeatByUserId.mockResolvedValue(mockSeat);
      repository.findProgramById.mockResolvedValue(null);
      await expect(service.upgradeSeat('user-1', 'prog-2')).rejects.toThrow(NotFoundException);
    });

    it('should reject if target is not an upgrade', async () => {
      const cheaperProgram = { ...mockProgram, price: 100, slug: 'cheaper' };
      repository.getSeatByUserId.mockResolvedValue(mockSeat);
      repository.findProgramById.mockResolvedValue(cheaperProgram);
      await expect(service.upgradeSeat('user-1', 'cheaper')).rejects.toThrow(BadRequestException);
    });
  });

  describe('seat allocation - concurrent safety', () => {
    it('should handle concurrent seat claims atomically', async () => {
      const program = { ...mockProgram, usedSeats: 4999, totalSeats: 5000 };
      repository.findProgramById.mockResolvedValue(program);
      repository.getSeatByUserId.mockResolvedValue(null);

      repository.claimSeatAtomic
        .mockResolvedValueOnce({ success: true, seat: mockSeat })
        .mockResolvedValueOnce({ success: false, error: 'No seats available' });

      const result1 = await service.claimSeat('user-1', 'prog-1');
      expect(result1.id).toBe('seat-1');

      await expect(service.claimSeat('user-2', 'prog-1')).rejects.toThrow(ConflictException);
    });
  });
});
