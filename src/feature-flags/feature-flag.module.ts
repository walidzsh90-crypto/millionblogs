import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagRepository } from './feature-flag.repository';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [FeatureFlagService, FeatureFlagRepository],
  exports: [FeatureFlagService, FeatureFlagRepository],
})
export class FeatureFlagModule {}
