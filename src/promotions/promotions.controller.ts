import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles, ROLES } from '../roles';
import { PromotionsService } from './promotions.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignFilterDto } from './dto/campaign-filter.dto';
import { CurrentUser } from '../users';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('packages')
  async getPackages() {
    return this.promotionsService.getPackages();
  }

  @Get('rotation/:type')
  async getRotation(@Param('type') type: string, @Query('limit') limit?: string) {
    return this.promotionsService.getRotation(
      type as 'article' | 'showcase',
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Post('impression')
  async recordImpression(@Body('campaignId') campaignId: string) {
    return this.promotionsService.recordImpression(campaignId);
  }

  @Post('click')
  async recordClick(@Body('campaignId') campaignId: string) {
    return this.promotionsService.recordClick(campaignId);
  }
}

@Controller('account/promotions')
@UseGuards(AuthGuard('jwt'))
export class AccountPromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('campaigns')
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateCampaignDto) {
    return this.promotionsService.createCampaign(user.id, dto);
  }

  @Get('campaigns')
  async list(@CurrentUser() user: { id: string }, @Query() filter: CampaignFilterDto) {
    return this.promotionsService.getUserCampaigns(user.id, filter);
  }

  @Get('campaigns/:id')
  async get(@Param('id') id: string) {
    return this.promotionsService.getCampaign(id);
  }

  @Post('campaigns/:id/activate')
  async activate(@Param('id') id: string) {
    return this.promotionsService.activateCampaign(id);
  }

  @Post('campaigns/:id/pause')
  async pause(@Param('id') id: string) {
    return this.promotionsService.pauseCampaign(id);
  }

  @Post('campaigns/:id/cancel')
  async cancel(@Param('id') id: string) {
    return this.promotionsService.cancelCampaign(id);
  }
}

@Controller('admin/promotions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminPromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('packages')
  async getPackages() {
    return this.promotionsService.getAllPackages();
  }

  @Post('packages')
  async createPackage(@Body() dto: any) {
    return this.promotionsService.createPackage(dto);
  }

  @Put('packages/:id')
  async updatePackage(@Param('id') id: string, @Body() dto: any) {
    return this.promotionsService.updatePackage(id, dto);
  }

  @Delete('packages/:id')
  async deletePackage(@Param('id') id: string) {
    return this.promotionsService.deletePackage(id);
  }

  @Get('campaigns')
  async listCampaigns(@Query() filter: CampaignFilterDto) {
    return this.promotionsService.getAllCampaigns(filter);
  }

  @Post('campaigns/:id/activate')
  async activateCampaign(@Param('id') id: string) {
    return this.promotionsService.activateCampaign(id);
  }

  @Post('campaigns/:id/pause')
  async pauseCampaign(@Param('id') id: string) {
    return this.promotionsService.pauseCampaign(id);
  }

  @Post('campaigns/:id/complete')
  async completeCampaign(@Param('id') id: string) {
    return this.promotionsService.completeCampaign(id);
  }

  @Post('campaigns/:id/cancel')
  async cancelCampaign(@Param('id') id: string) {
    return this.promotionsService.cancelCampaign(id);
  }

  @Get('stats')
  async stats() {
    return this.promotionsService.getStats();
  }

  @Post('expire')
  async expireCampaigns() {
    return this.promotionsService.expireCampaigns();
  }
}
