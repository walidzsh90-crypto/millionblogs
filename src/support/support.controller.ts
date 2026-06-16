import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, ROLES } from '../roles';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ReplyDto } from './dto/reply.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { CurrentUser } from '../users';

@Controller('account/support')
@UseGuards(AuthGuard('jwt'))
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(user.id, dto.subject, dto.body);
  }

  @Get('tickets')
  async list(@CurrentUser() user: { id: string }, @Query() filter: TicketFilterDto) {
    return this.supportService.getMyTickets(user.id, filter);
  }

  @Get('tickets/:id')
  async get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.supportService.getTicket(id, user.id);
  }

  @Post('tickets/:id/reply')
  async reply(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: ReplyDto) {
    return this.supportService.addReply(id, user.id, dto.body);
  }

  @Post('tickets/:id/close')
  async close(@CurrentUser() _user: { id: string }, @Param('id') id: string) {
    return this.supportService.changeStatus(id, 'closed');
  }

  @Post('tickets/:id/reopen')
  async reopen(@CurrentUser() _user: { id: string }, @Param('id') id: string) {
    return this.supportService.changeStatus(id, 'open');
  }
}

@Controller('admin/support')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  async list(@Query() filter: TicketFilterDto) {
    return this.supportService.getAllTickets(filter);
  }

  @Get('tickets/:id')
  async get(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @Post('tickets/:id/reply')
  async reply(@Param('id') id: string, @Body() dto: ReplyDto, @CurrentUser() user: { id: string }) {
    return this.supportService.addReply(id, user.id, dto.body);
  }

  @Post('tickets/:id/status')
  async changeStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.supportService.changeStatus(id, status);
  }

  @Post('tickets/:id/assign')
  async assign(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.supportService.assignTicket(id, user.id);
  }

  @Post('tickets/:id/reopen')
  async reopen(@Param('id') id: string) {
    return this.supportService.changeStatus(id, 'open');
  }

  @Get('stats')
  async stats() {
    return this.supportService.getStats();
  }
}
