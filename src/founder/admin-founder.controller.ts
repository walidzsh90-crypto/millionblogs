import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, ROLES } from '../roles';
import { FounderService } from './founder.service';
import { FounderFilterDto } from './dto/founder-filter.dto';

@Controller('admin/founder')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminFounderController {
  constructor(private readonly founderService: FounderService) {}

  @Get('programs')
  async getPrograms(@Query() filter: FounderFilterDto) {
    return this.founderService.getAllPrograms(filter);
  }

  @Get('programs/:slug')
  async getProgram(@Param('slug') slug: string) {
    return this.founderService.getProgram(slug);
  }

  @Post('programs/seed')
  async seedPrograms() {
    return this.founderService.seedPrograms();
  }

  @Post('programs/:id/close')
  async closeProgram(@Param('id') id: string) {
    return this.founderService.closeProgram(id);
  }

  @Get('seats')
  async getSeats(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.founderService.getSeats(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
