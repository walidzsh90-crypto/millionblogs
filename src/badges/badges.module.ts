import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { BadgesService } from './badges.service';
import { BadgesRepository } from './badges.repository';
import { BadgesController, AccountBadgesController, AdminBadgesController } from './badges.controller';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [BadgesController, AccountBadgesController, AdminBadgesController],
  providers: [BadgesService, BadgesRepository],
  exports: [BadgesService, BadgesRepository],
})
export class BadgesModule {}
