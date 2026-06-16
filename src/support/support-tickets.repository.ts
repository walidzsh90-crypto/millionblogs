import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { TicketFilterDto } from './dto/ticket-filter.dto';

@Injectable()
export class SupportTicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; subject: string; body?: string; status?: string }) {
    return this.prisma.supportTicket.create({ data });
  }

  async findById(id: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, displayName: true } }, replies: { include: { user: { select: { id: true, displayName: true } } }, orderBy: { createdAt: 'asc' } } },
    });
  }

  async findByUserId(userId: string, filter: TicketFilterDto) {
    const where: Record<string, unknown> = { userId };
    if (filter.status) where.status = filter.status;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: where as any,
        include: { user: { select: { id: true, displayName: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.supportTicket.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async findAll(filter: TicketFilterDto) {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: where as any,
        include: { user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.supportTicket.count({ where: where as any }),
    ]);

    return { items, total, page, pageSize };
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.prisma.supportTicket.update({ where: { id }, data });
  }

  async addReply(ticketId: string, userId: string, body: string) {
    return this.prisma.supportReply.create({
      data: { ticketId, userId, body },
    });
  }

  async getStats() {
    const [total, open, pending, answered, closed] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.supportTicket.count({ where: { status: 'pending' } }),
      this.prisma.supportTicket.count({ where: { status: 'answered' } }),
      this.prisma.supportTicket.count({ where: { status: 'closed' } }),
    ]);

    return { total, open, pending, answered, closed };
  }
}
