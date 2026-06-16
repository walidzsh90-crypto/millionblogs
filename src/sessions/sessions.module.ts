import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from './sessions.repository';
import { SessionsController } from './sessions.controller';
import { AuditModule } from '../audit';
import { EventsModule } from '../events';

@Module({
  imports: [PrismaModule, AuditModule, EventsModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository],
  exports: [SessionsService, SessionsRepository],
})
export class SessionsModule {}
