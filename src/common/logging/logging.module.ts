import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { RequestIdMiddleware } from './request-id.middleware';

@Global()
@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware, RequestIdMiddleware).forRoutes('*');
  }
}
