import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupportTicketsRepository } from './support-tickets.repository';
import { DomainEventPublisher } from '../events';
import { EventName } from '../events/event-names';
import { v4 as uuidv4 } from 'uuid';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportTicketsRepository: SupportTicketsRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createTicket(userId: string, subject: string, body?: string) {
    const ticket = await this.supportTicketsRepository.create({ userId, subject, body });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.TICKET_CREATED,
      aggregateId: ticket.id,
      aggregateType: 'support_ticket',
      payload: { ticketId: ticket.id, userId, subject },
      occurredAt: new Date(),
    });

    return TicketResponseDto.fromEntity(ticket);
  }

  async getTicket(ticketId: string, userId?: string) {
    const ticket = await this.supportTicketsRepository.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (userId && ticket.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return TicketResponseDto.fromEntity(ticket);
  }

  async getMyTickets(userId: string, filter: TicketFilterDto) {
    const result = await this.supportTicketsRepository.findByUserId(userId, filter);
    return {
      ...result,
      items: result.items.map((t: any) => TicketResponseDto.fromEntity(t)),
    };
  }

  async addReply(ticketId: string, userId: string, body: string) {
    const ticket = await this.supportTicketsRepository.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.status === 'closed' || ticket.status === 'archived') {
      throw new BadRequestException('Cannot reply to closed or archived ticket');
    }

    const reply = await this.supportTicketsRepository.addReply(ticketId, userId, body);

    if (ticket.userId === userId) {
      await this.supportTicketsRepository.update(ticketId, { status: 'pending' });
    } else {
      await this.supportTicketsRepository.update(ticketId, { status: 'answered' });
    }

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.TICKET_REPLIED,
      aggregateId: ticketId,
      aggregateType: 'support_ticket',
      payload: { ticketId, userId, replyId: reply.id },
      occurredAt: new Date(),
    });

    return reply;
  }

  async changeStatus(ticketId: string, status: string) {
    const ticket = await this.supportTicketsRepository.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updated = await this.supportTicketsRepository.update(ticketId, {
      status,
      ...(status === 'closed' ? { closedAt: new Date() } : {}),
    });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.TICKET_STATUS_CHANGED,
      aggregateId: ticketId,
      aggregateType: 'support_ticket',
      payload: { ticketId, fromStatus: ticket.status, toStatus: status },
      occurredAt: new Date(),
    });

    return TicketResponseDto.fromEntity(updated);
  }

  async assignTicket(ticketId: string, adminUserId: string) {
    const ticket = await this.supportTicketsRepository.findById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updated = await this.supportTicketsRepository.update(ticketId, { assignedTo: adminUserId });

    await this.eventPublisher.publish({
      eventId: uuidv4(),
      eventName: EventName.TICKET_ASSIGNED,
      aggregateId: ticketId,
      aggregateType: 'support_ticket',
      payload: { ticketId, assignedTo: adminUserId },
      occurredAt: new Date(),
    });

    return TicketResponseDto.fromEntity(updated);
  }

  // Admin
  async getAllTickets(filter: TicketFilterDto) {
    const result = await this.supportTicketsRepository.findAll(filter);
    return {
      ...result,
      items: result.items.map((t: any) => TicketResponseDto.fromEntity(t)),
    };
  }

  async getStats() {
    return this.supportTicketsRepository.getStats();
  }
}
