import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { FounderRepository } from './founder.repository';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';
import { FounderProgramResponseDto } from './dto/founder-program-response.dto';
import { FounderSeatResponseDto } from './dto/founder-seat-response.dto';
import { FounderFilterDto } from './dto/founder-filter.dto';

@Injectable()
export class FounderService {
  constructor(
    private readonly founderRepository: FounderRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async getPrograms() {
    const programs = await this.founderRepository.findOpenPrograms();
    return programs.map((p: any) => FounderProgramResponseDto.fromEntity(p));
  }

  async getAllPrograms(filter: FounderFilterDto) {
    const result = await this.founderRepository.findAllPrograms(filter);
    return {
      ...result,
      items: result.items.map((p: any) => FounderProgramResponseDto.fromEntity(p)),
    };
  }

  async getProgram(slug: string) {
    const program = await this.founderRepository.findProgramBySlug(slug);
    if (!program) throw new NotFoundException('Founder program not found');
    return FounderProgramResponseDto.fromEntity(program);
  }

  async getMySeat(userId: string) {
    const seat = await this.founderRepository.getSeatByUserId(userId);
    if (!seat) return null;
    return FounderSeatResponseDto.fromEntity(seat);
  }

  async claimSeat(userId: string, programId: string) {
    const program = await this.founderRepository.findProgramById(programId);
    if (!program) throw new NotFoundException('Founder program not found');
    if (program.status !== 'open') throw new BadRequestException('Program is closed');
    if (program.usedSeats >= program.totalSeats) throw new ConflictException('No seats available');

    const existing = await this.founderRepository.getSeatByUserId(userId);
    if (existing) throw new ConflictException('Already have a founder seat');

    const result = await this.founderRepository.claimSeatAtomic(programId, userId);
    if (!result.success) throw new ConflictException(result.error || 'Failed to claim seat');

    const updatedProgram = await this.founderRepository.findProgramById(programId);
    if (updatedProgram && updatedProgram.usedSeats >= updatedProgram.totalSeats) {
      await this.eventPublisher.publish({
        eventId: uuidv4(),
        eventName: EventName.FOUNDER_PROGRAM_CLOSED,
        aggregateId: programId,
        aggregateType: 'founder_program',
        payload: { programId, slug: program.slug, name: program.name },
        occurredAt: new Date(),
      });
    }

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.FOUNDER_SEAT_CLAIMED,
      aggregateId: userId,
      aggregateType: 'user',
      payload: { userId, programId, programName: program.name, badgeLabel: program.badgeLabel },
      occurredAt: new Date(),
    });

    return FounderSeatResponseDto.fromEntity(result.seat);
  }

  async upgradeSeat(userId: string, targetProgramId: string) {
    const currentSeat = await this.founderRepository.getSeatByUserId(userId);
    if (!currentSeat) throw new BadRequestException('No founder seat to upgrade');

    const targetProgram = await this.founderRepository.findProgramById(targetProgramId);
    if (!targetProgram) throw new NotFoundException('Target program not found');
    if (targetProgram.status !== 'open') throw new BadRequestException('Target program is closed');

    if (targetProgram.price <= currentSeat.program.price) {
      throw new BadRequestException('Target program is not an upgrade');
    }

    const result = await this.founderRepository.upgradeSeatAtomic(
      currentSeat.programId,
      targetProgramId,
      userId,
    );

    if (!result.success) throw new ConflictException(result.error || 'Failed to upgrade seat');

    const priceDiff = targetProgram.price - currentSeat.program.price;

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.FOUNDER_UPGRADED,
      aggregateId: userId,
      aggregateType: 'user',
      payload: {
        userId,
        fromProgram: currentSeat.program.name,
        toProgram: targetProgram.name,
        priceDifference: priceDiff,
        badgeLabel: targetProgram.badgeLabel,
      },
      occurredAt: new Date(),
    });

    return FounderSeatResponseDto.fromEntity(result.seat);
  }

  async getSeats(page = 1, pageSize = 20) {
    const result = await this.founderRepository.getAllSeats(page, pageSize);
    return {
      ...result,
      items: result.items.map((s: any) => FounderSeatResponseDto.fromEntity(s)),
    };
  }

  async closeProgram(programId: string) {
    const program = await this.founderRepository.findProgramById(programId);
    if (!program) throw new NotFoundException('Program not found');

    const updated = await this.founderRepository.closeProgram(programId);

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.FOUNDER_PROGRAM_CLOSED,
      aggregateId: programId,
      aggregateType: 'founder_program',
      payload: { programId, slug: program.slug, name: program.name },
      occurredAt: new Date(),
    });

    return FounderProgramResponseDto.fromEntity(updated);
  }

  async seedPrograms() {
    await this.founderRepository.seedDefaultPrograms();
    return { seeded: true };
  }
}
