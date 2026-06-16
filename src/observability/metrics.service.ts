import { Injectable, Logger } from '@nestjs/common';
import { Metric, MetricReporter } from './interfaces/metrics.interface';

@Injectable()
export class MetricsService implements MetricReporter {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metrics: Metric[] = [];

  record(metric: Metric): void {
    this.metrics.push(metric);
    this.logger.debug(
      { metricName: metric.name, value: metric.value },
      'Metric recorded',
    );
  }

  increment(name: string, labels?: Record<string, string>): void {
    this.record({ name, value: 1, labels });
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.record({ name, value, labels });
  }

  timing(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.record({ name, value: durationMs, labels });
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  flush(): void {
    this.metrics.length = 0;
  }
}
