import { Injectable, Logger } from '@nestjs/common';

interface DeadLetterEntry {
  jobId: string;
  jobName: string;
  data: unknown;
  attempts: number;
  lastError: string;
  failedAt: Date;
}

@Injectable()
export class DeadLetterService {
  private readonly logger = new Logger(DeadLetterService.name);
  private readonly store: DeadLetterEntry[] = [];

  async sendToDeadLetter(entry: Omit<DeadLetterEntry, 'failedAt'>): Promise<void> {
    const deadLetter: DeadLetterEntry = {
      ...entry,
      failedAt: new Date(),
    };
    this.store.push(deadLetter);
    this.logger.warn(
      { jobName: entry.jobName, jobId: entry.jobId, error: entry.lastError },
      'Job sent to dead letter queue',
    );
  }

  async getDeadLetters(): Promise<DeadLetterEntry[]> {
    return [...this.store];
  }

  async replay(jobId: string): Promise<boolean> {
    const index = this.store.findIndex((entry) => entry.jobId === jobId);
    if (index === -1) return false;
    this.store.splice(index, 1);
    return true;
  }
}
