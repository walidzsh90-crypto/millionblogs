import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService } from './metrics.service';
import { TracingService } from './tracing.service';
import { PerformanceInterceptor } from './performance.interceptor';

@Global()
@Module({
  providers: [
    MetricsService,
    TracingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
  exports: [MetricsService, TracingService],
})
export class ObservabilityModule {}
