import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanFilterDto } from './dto/plan-filter.dto';
import { Roles, ROLES } from '../roles';

@Controller('admin/plans')
@UseGuards(AuthGuard('jwt'))
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async list(@Query() filter: PlanFilterDto) {
    return this.plansService.findAll(filter);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.plansService.delete(id);
  }

  @Post('seed')
  async seed() {
    await this.plansService.seedDefaultPlans();
    return { message: 'Default plans seeded' };
  }
}
