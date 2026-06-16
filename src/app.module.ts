import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { PrismaModule } from './prisma';
import { LoggingModule } from './common/logging';
import { HealthModule } from './common/health';
// import { SecurityModule } from './common/security';
import { FeatureFlagModule } from './feature-flags';
import { AuditModule } from './audit';
import { ActivityModule } from './activity';
import { EventBusModule } from './events';
import { JobsModule } from './jobs';
import { BackupModule } from './backup';
import { ObservabilityModule } from './observability';
import { RolesModule } from './roles';
import { UsersModule } from './users';
import { AuthModule } from './auth';
import { SessionsModule } from './sessions';
import { BlogsModule } from './blogs';
import { VerificationModule } from './verification';
import { RssModule } from './rss';
import { ArticlesModule } from './articles';
import { SearchModule } from './search';
import { SeoModule } from './seo';
import { WalletModule } from './wallet';
import { PlansModule } from './plans';
import { PaymentsModule } from './payments';
import { FounderModule } from './founder';
import { SubscriptionsModule } from './subscriptions';
import { FeatureAccessModule } from './feature-access';
import { PromotionsModule } from './promotions';
import { BadgesModule } from './badges';
import { NotificationsModule } from './notifications';
import { SupportModule } from './support';
import { OutboxModule } from './outbox';
import { APP_FILTER } from '@nestjs/core';
import { AppExceptionFilter } from './common/errors';

@Module({
  imports: [
    // Foundation
    ConfigModule,
    PrismaModule,
    LoggingModule,
    // SecurityModule,

    // Infrastructure
    FeatureFlagModule,
    AuditModule,
    ActivityModule,
    EventBusModule,
    JobsModule,
    BackupModule,
    ObservabilityModule,

    // Identity Layer
    RolesModule,
    UsersModule,
    AuthModule,
    SessionsModule,

    // Health (has controller)
    HealthModule,

    // Application Modules
    BlogsModule,
    VerificationModule,
    RssModule,
    ArticlesModule,
    SearchModule,
    SeoModule,
    WalletModule,
    PlansModule,
    PaymentsModule,
    FounderModule,
    SubscriptionsModule,
    FeatureAccessModule,
    PromotionsModule,
    BadgesModule,
    NotificationsModule,
    SupportModule,
    OutboxModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
