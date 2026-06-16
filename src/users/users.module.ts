import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { ActivityModule } from '../activity';
import { EventsModule } from '../events';

@Module({
  imports: [PrismaModule, ActivityModule, EventsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
