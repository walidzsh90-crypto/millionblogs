import { Test, TestingModule } from '@nestjs/testing';
import { FounderRepository } from '../../../src/founder/founder.repository';
import { PrismaService } from '../../../src/prisma';

describe('FounderRepository', () => {
  let repository: FounderRepository;
  let prisma: any;

  const mockTx = {
    founderProgram: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    founderSeat: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    prisma = {
      founderProgram: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      founderSeat: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        update: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FounderRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<FounderRepository>(FounderRepository);
  });

  describe('claimSeatAtomic', () => {
    it('should claim seat successfully within transaction', async () => {
      const program = {
        id: 'prog-1',
        totalSeats: 5000,
        usedSeats: 100,
        status: 'open',
        badgeLabel: 'Founder Pro',
      };

      mockTx.founderProgram.findUnique.mockResolvedValue(program);
      mockTx.founderSeat.findUnique.mockResolvedValue(null);
      mockTx.founderProgram.update.mockResolvedValue({ ...program, usedSeats: 101 });
      mockTx.founderSeat.create.mockResolvedValue({ id: 'seat-1' });

      const result = await repository.claimSeatAtomic('prog-1', 'user-1');
      expect(result.success).toBe(true);
    });

    it('should reject if program not found', async () => {
      mockTx.founderProgram.findUnique.mockResolvedValue(null);
      const result = await repository.claimSeatAtomic('invalid', 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Program not found');
    });

    it('should reject if program closed', async () => {
      mockTx.founderProgram.findUnique.mockResolvedValue({ status: 'closed', usedSeats: 100, totalSeats: 5000 });
      const result = await repository.claimSeatAtomic('prog-1', 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Program is closed');
    });

    it('should reject if seats full', async () => {
      mockTx.founderProgram.findUnique.mockResolvedValue({ status: 'open', usedSeats: 5000, totalSeats: 5000 });
      const result = await repository.claimSeatAtomic('prog-1', 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No seats available');
    });

    it('should reject if user already has seat', async () => {
      mockTx.founderProgram.findUnique.mockResolvedValue({ status: 'open', usedSeats: 100, totalSeats: 5000 });
      mockTx.founderSeat.findUnique.mockResolvedValue({ id: 'existing-seat' });
      const result = await repository.claimSeatAtomic('prog-1', 'user-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('User already has a founder seat');
    });

    it('should auto-close program when seats exhausted', async () => {
      const program = {
        id: 'prog-1',
        totalSeats: 5000,
        usedSeats: 4999,
        status: 'open',
        badgeLabel: 'Founder Pro',
        slug: 'founder-pro',
      };

      mockTx.founderProgram.findUnique.mockResolvedValue(program);
      mockTx.founderSeat.findUnique.mockResolvedValue(null);
      mockTx.founderProgram.update
        .mockResolvedValueOnce({ ...program, usedSeats: 5000 })
        .mockResolvedValueOnce({ ...program, usedSeats: 5000, status: 'closed' });
      mockTx.founderSeat.create.mockResolvedValue({ id: 'seat-last' });

      const result = await repository.claimSeatAtomic('prog-1', 'user-1');
      expect(result.success).toBe(true);
      expect(mockTx.founderProgram.update).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: { status: 'closed' } }),
      );
    });
  });

  describe('upgradeSeatAtomic', () => {
    it('should upgrade seat successfully', async () => {
      mockTx.founderProgram.findUnique.mockResolvedValue({
        id: 'prog-2',
        status: 'open',
        usedSeats: 50,
        totalSeats: 1000,
      });
      mockTx.founderSeat.findUnique.mockResolvedValue({
        userId: 'user-1',
        programId: 'prog-1',
      });
      mockTx.founderSeat.delete.mockResolvedValue({});
      mockTx.founderProgram.update
        .mockResolvedValueOnce({ usedSeats: 99 })
        .mockResolvedValueOnce({ usedSeats: 51 });
      mockTx.founderSeat.create.mockResolvedValue({ id: 'new-seat' });
      mockTx.user.update.mockResolvedValue({});

      const result = await repository.upgradeSeatAtomic('prog-1', 'prog-2', 'user-1');
      expect(result.success).toBe(true);
    });
  });
});
