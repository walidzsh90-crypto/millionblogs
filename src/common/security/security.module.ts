import { Global, Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '../../config';
import { SecurityConfigService } from './security-config.service';
import { PasswordPolicyService } from './password-policy.service';
import { SanitizationService } from './sanitization.service';
import { BruteForceService } from './brute-force.service';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL') * 1000,
            limit: config.get('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
  ],
  providers: [
    SecurityConfigService,
    PasswordPolicyService,
    SanitizationService,
    BruteForceService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [SecurityConfigService, PasswordPolicyService, SanitizationService, BruteForceService],
})
export class SecurityModule {}
