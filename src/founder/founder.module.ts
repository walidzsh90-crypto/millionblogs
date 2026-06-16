import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { FounderService } from './founder.service';
import { FounderRepository } from './founder.repository';
import { FounderController } from './founder.controller';
import { AdminFounderController } from './admin-founder.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [FounderController, AdminFounderController],
  providers: [FounderService, FounderRepository],
  exports: [FounderService, FounderRepository],
})
export class FounderModule {}
