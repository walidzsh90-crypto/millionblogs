import { Injectable, Logger } from '@nestjs/common';

interface Span {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: Date;
  endTime?: Date;
  attributes: Record<string, unknown>;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private readonly spans: Span[] = [];

  startSpan(name: string, attributes?: Record<string, unknown>): Pick<Span, 'traceId' | 'spanId'> {
    const span: Span = {
      name,
      traceId: crypto.randomUUID(),
      spanId: crypto.randomUUID(),
      startTime: new Date(),
      attributes: attributes ?? {},
    };
    this.spans.push(span);
    return { traceId: span.traceId, spanId: span.spanId };
  }

  endSpan(spanId: string, attributes?: Record<string, unknown>): void {
    const span = this.spans.find((s) => s.spanId === spanId);
    if (span) {
      span.endTime = new Date();
      if (attributes) {
        Object.assign(span.attributes, attributes);
      }
      const duration = span.endTime.getTime() - span.startTime.getTime();
      this.logger.debug(
        { spanName: span.name, durationMs: duration },
        'Span ended',
      );
    }
  }
}
