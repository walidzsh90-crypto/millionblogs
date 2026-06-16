import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FounderService } from './founder.service';
import { ClaimFounderDto } from './dto/claim-founder.dto';
import { UpgradeFounderDto } from './dto/upgrade-founder.dto';
import { CurrentUser } from '../users';

@Controller('founder')
export class FounderController {
  constructor(private readonly founderService: FounderService) {}

  @Get('programs')
  async getPrograms() {
    return this.founderService.getPrograms();
  }

  @Get('programs/:slug')
  async getProgram(@Param('slug') slug: string) {
    return this.founderService.getProgram(slug);
  }

  @Post('claim')
  @UseGuards(AuthGuard('jwt'))
  async claimSeat(@CurrentUser() user: { id: string }, @Body() dto: ClaimFounderDto) {
    return this.founderService.claimSeat(user.id, dto.programId);
  }

  @Post('upgrade')
  @UseGuards(AuthGuard('jwt'))
  async upgradeSeat(@CurrentUser() user: { id: string }, @Body() dto: UpgradeFounderDto) {
    return this.founderService.upgradeSeat(user.id, dto.targetProgramId);
  }

  @Get('my-seat')
  @UseGuards(AuthGuard('jwt'))
  async getMySeat(@CurrentUser() user: { id: string }) {
    return this.founderService.getMySeat(user.id);
  }
}
