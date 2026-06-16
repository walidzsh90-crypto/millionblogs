import { Controller, Get, Param } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async list() {
    return this.plansService.findActive();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.plansService.findBySlug(slug);
  }
}
