import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config';

@Injectable()
export class SecurityConfigService {
  constructor(private readonly config: ConfigService) {}

  get helmetConfig(): Record<string, unknown> {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      xFrameOptions: { action: 'deny' },
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    };
  }

  get corsConfig() {
    return {
      origin: this.config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-Id',
        'X-Correlation-Id',
      ],
      exposedHeaders: ['X-Request-Id'],
      credentials: true,
      maxAge: 3600,
    };
  }

  get throttleConfig() {
    return {
      ttl: this.config.get('THROTTLE_TTL'),
      limit: this.config.get('THROTTLE_LIMIT'),
    };
  }
}
