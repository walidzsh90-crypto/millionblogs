import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SessionsService } from './sessions.service';
import { CurrentUser } from '../users';

@Controller('sessions')
@UseGuards(AuthGuard('jwt'))
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getSessions(@CurrentUser() user: { id: string }) {
    return this.sessionsService.getUserSessions(user.id);
  }

  @Delete(':id')
  async revokeSession(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.sessionsService.revokeSession(id, user.id);
    return { message: 'Session revoked' };
  }
}
