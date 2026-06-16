import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { FounderFilterDto } from './dto/founder-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FounderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProgramBySlug(slug: string) {
    return this.prisma.founderProgram.findUnique({ where: { slug } });
  }

  async findProgramById(id: string) {
    return this.prisma.founderProgram.findUnique({ where: { id } });
  }

  async findOpenPrograms() {
    return this.prisma.founderProgram.findMany({
      where: { status: 'open' },
      orderBy: { price: 'asc' },
    });
  }

  async findAllPrograms(filter: FounderFilterDto) {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.founderProgram.findMany({
        where: where as any,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.founderProgram.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async getSeatByUserId(userId: string) {
    return this.prisma.founderSeat.findUnique({
      where: { userId },
      include: { program: true },
    });
  }

  async getSeatById(id: string) {
    return this.prisma.founderSeat.findUnique({
      where: { id },
      include: { program: true },
    });
  }

  async getSeatsByProgramId(programId: string) {
    return this.prisma.founderSeat.findMany({
      where: { programId },
      include: { program: true },
      orderBy: { claimedAt: 'desc' },
    });
  }

  async getAllSeats(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.founderSeat.findMany({
        include: { program: true, user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { claimedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.founderSeat.count(),
    ]);
    return { items, total, page, pageSize };
  }

  async claimSeatAtomic(programId: string, userId: string): Promise<{ success: boolean; error?: string; seat?: any; previousProgram?: any; targetProgram?: any }> {
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const program = await tx.founderProgram.findUnique({
        where: { id: programId },
      });

      if (!program) return { success: false, error: 'Program not found' };
      if (program.status !== 'open') return { success: false, error: 'Program is closed' };
      if (program.usedSeats >= program.totalSeats) return { success: false, error: 'No seats available' };

      const existingSeat = await tx.founderSeat.findUnique({
        where: { userId },
      });
      if (existingSeat) return { success: false, error: 'User already has a founder seat' };

      const updated = await tx.founderProgram.update({
        where: { id: programId, usedSeats: program.usedSeats },
        data: { usedSeats: { increment: 1 } },
      });

      if (updated.usedSeats !== program.usedSeats + 1) {
        return { success: false, error: 'Concurrent seat claim detected' };
      }

      const seat = await tx.founderSeat.create({
        data: { userId, programId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { founderBadge: program.badgeLabel },
      });

      if (updated.usedSeats >= updated.totalSeats) {
        await tx.founderProgram.update({
          where: { id: programId },
          data: { status: 'closed' },
        });
      }

      return { success: true, seat };
    });

    return result;
  }

  async upgradeSeatAtomic(
    currentProgramId: string,
    targetProgramId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string; seat?: any; previousProgram?: any; targetProgram?: any }> {
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const targetProgram = await tx.founderProgram.findUnique({
        where: { id: targetProgramId },
      });

      if (!targetProgram) return { success: false, error: 'Target program not found' };
      if (targetProgram.status !== 'open') return { success: false, error: 'Target program is closed' };
      if (targetProgram.usedSeats >= targetProgram.totalSeats) {
        return { success: false, error: 'No seats available in target program' };
      }

      const seat = await tx.founderSeat.findUnique({ where: { userId } });
      if (!seat) return { success: false, error: 'No founder seat found' };
      if (seat.programId !== currentProgramId) {
        return { success: false, error: 'Current program mismatch' };
      }

      const seatDeleted = await tx.founderSeat.delete({ where: { userId } });
      if (!seatDeleted) return { success: false, error: 'Failed to release current seat' };

      const currentProgram = await tx.founderProgram.update({
        where: { id: currentProgramId },
        data: { usedSeats: { decrement: 1 } },
      });

      const targetUpdated = await tx.founderProgram.update({
        where: { id: targetProgramId, usedSeats: targetProgram.usedSeats },
        data: { usedSeats: { increment: 1 } },
      });

      if (targetUpdated.usedSeats !== targetProgram.usedSeats + 1) {
        await tx.founderProgram.update({
          where: { id: currentProgramId },
          data: { usedSeats: { increment: 1 } },
        });
        await tx.founderSeat.create({
          data: { userId, programId: currentProgramId },
        });
        return { success: false, error: 'Concurrent seat claim detected on target' };
      }

      const newSeat = await tx.founderSeat.create({
        data: { userId, programId: targetProgramId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { founderBadge: targetProgram.badgeLabel },
      });

      if (targetUpdated.usedSeats >= targetUpdated.totalSeats) {
        await tx.founderProgram.update({
          where: { id: targetProgramId },
          data: { status: 'closed' },
        });
      }

      return { success: true, seat: newSeat, previousProgram: currentProgram, targetProgram };
    });

    return result;
  }

  async closeProgram(programId: string) {
    return this.prisma.founderProgram.update({
      where: { id: programId },
      data: { status: 'closed' },
    });
  }

  async updateProgram(id: string, data: Record<string, unknown>) {
    return this.prisma.founderProgram.update({ where: { id }, data });
  }

  async seedDefaultPrograms() {
    const existing = await this.prisma.founderProgram.count();
    if (existing > 0) return;

    await this.prisma.founderProgram.createMany({
      data: [
        {
          slug: 'founder-pro',
          name: 'Founder Pro',
          price: 1595,
          currency: 'usd',
          totalSeats: 5000,
          usedSeats: 0,
          status: 'open',
          badgeLabel: 'Founder Pro',
          benefits: {
            lifetimeAccess: true,
            noRecurringBilling: true,
            proFeatures: true,
          },
        },
        {
          slug: 'founder-master',
          name: 'Founder Master',
          price: 5000,
          currency: 'usd',
          totalSeats: 1000,
          usedSeats: 0,
          status: 'open',
          badgeLabel: 'Founder Master',
          benefits: {
            lifetimeAccess: true,
            noRecurringBilling: true,
            masterFeatures: true,
            welcomeCredits: true,
          },
        },
      ],
    });
  }
}
