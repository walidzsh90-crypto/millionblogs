import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { WalletModule } from '../wallet';
import { FeatureAccessModule } from '../feature-access';
import { PromotionPackagesRepository } from './promotion-packages.repository';
import { PromotionCampaignsRepository } from './promotion-campaigns.repository';
import { RotationService } from './rotation.service';
import { PromotionsService } from './promotions.service';
import {
  PromotionsController,
  AccountPromotionsController,
  AdminPromotionsController,
} from './promotions.controller';

@Module({
  imports: [PrismaModule, EventsModule, WalletModule, FeatureAccessModule],
  controllers: [PromotionsController, AccountPromotionsController, AdminPromotionsController],
  providers: [
    PromotionPackagesRepository,
    PromotionCampaignsRepository,
    RotationService,
    PromotionsService,
  ],
  exports: [PromotionsService, RotationService],
})
export class PromotionsModule {}
