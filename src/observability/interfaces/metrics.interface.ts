export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface MetricReporter {
  record(metric: Metric): void;
  increment(name: string, labels?: Record<string, string>): void;
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  timing(name: string, durationMs: number, labels?: Record<string, string>): void;
}
