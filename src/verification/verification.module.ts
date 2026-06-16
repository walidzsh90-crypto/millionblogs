import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { VerificationService } from './verification.service';
import { OwnershipVerificationService } from './ownership-verification.service';
import { VerificationController } from './verification.controller';
import {
  ContentCheckStrategy,
  RuleEnforcementStrategy,
  HistoricalDataStrategy,
  ReputationAnalysisStrategy,
  MetaTagStrategy,
  DnsTxtStrategy,
  HtmlFileStrategy,
} from './strategies';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    OwnershipVerificationService,
    ContentCheckStrategy,
    RuleEnforcementStrategy,
    HistoricalDataStrategy,
    ReputationAnalysisStrategy,
    MetaTagStrategy,
    DnsTxtStrategy,
    HtmlFileStrategy,
  ],
  exports: [VerificationService, OwnershipVerificationService],
})
export class VerificationModule {}
