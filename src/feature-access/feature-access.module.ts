import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { FounderModule } from '../founder';
import { SubscriptionsModule } from '../subscriptions';
import { PlansModule } from '../plans';
import { FeatureAccessService } from './feature-access.service';

@Global()
@Module({
  imports: [PrismaModule, FounderModule, SubscriptionsModule, PlansModule],
  providers: [FeatureAccessService],
  exports: [FeatureAccessService],
})
export class FeatureAccessModule {}
