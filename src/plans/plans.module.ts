import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { PlansService } from './plans.service';
import { PlansRepository } from './plans.repository';
import { PlansController } from './plans.controller';
import { AdminPlansController } from './admin-plans.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [PlansController, AdminPlansController],
  providers: [PlansService, PlansRepository],
  exports: [PlansService, PlansRepository],
})
export class PlansModule {}
