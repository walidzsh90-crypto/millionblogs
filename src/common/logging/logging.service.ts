import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config';

export interface LogEntry {
  level: string;
  message: string;
  correlationId?: string;
  requestId?: string;
  timestamp: string;
  service: string;
  [key: string]: unknown;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger('App');
  private readonly serviceName: string;

  constructor(config: ConfigService) {
    this.serviceName = config.get('OTEL_SERVICE_NAME');
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.log(this.entry('info', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(this.entry('warn', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(this.entry('error', message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(this.entry('debug', message, meta));
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.logger.fatal(this.entry('fatal', message, meta));
  }

  private entry(
    level: string,
    message: string,
    meta?: Record<string, unknown>,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      correlationId: meta?.correlationId as string | undefined,
      requestId: meta?.requestId as string | undefined,
      ...meta,
    };
  }
}
