import 'dotenv/config';
import { Injectable, Logger } from '@nestjs/common';
import { Env, envSchema } from './config.schema';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly config: Env;

  constructor() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      this.logger.fatal({ errors }, 'Environment validation failed');
      throw new Error(
        `Environment validation failed:\n${JSON.stringify(errors, null, 2)}`,
      );
    }
    this.config = result.data;
  }

  get<T extends keyof Env>(key: T): Env[T] {
    return this.config[key];
  }

  get corsOrigins(): string[] {
    return this.config.CORS_ORIGINS.split(',').map((s) => s.trim());
  }

  get isDev(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  get isProd(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
}
