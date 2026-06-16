import { Injectable } from '@nestjs/common';

export interface JobRetryOptions {
  maxAttempts: number;
  backoffMs: number;
  exponential?: boolean;
}

@Injectable()
export class JobRetryService {
  calculateBackoff(attempt: number, options: JobRetryOptions): number {
    if (options.exponential) {
      return Math.min(options.backoffMs * Math.pow(2, attempt - 1), 300000);
    }
    return options.backoffMs;
  }

  shouldRetry(attempt: number, maxAttempts: number): boolean {
    return attempt < maxAttempts;
  }

  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
