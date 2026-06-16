import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { SupportService } from './support.service';
import { SupportTicketsRepository } from './support-tickets.repository';
import { SupportController, AdminSupportController } from './support.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, SupportTicketsRepository],
  exports: [SupportService, SupportTicketsRepository],
})
export class SupportModule {}
