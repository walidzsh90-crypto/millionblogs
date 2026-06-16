import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.metrics.timing(`http.${method}.${path.replace(/\//g, '_')}`, duration, {
            method,
            path,
            status: 'success',
          });
        },
        error: () => {
          const duration = Date.now() - start;
          this.metrics.timing(`http.${method}.${path.replace(/\//g, '_')}`, duration, {
            method,
            path,
            status: 'error',
          });
        },
      }),
    );
  }
}
