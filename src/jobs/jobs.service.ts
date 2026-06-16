import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobHandler } from './interfaces/job.interface';
import { JobRetryService } from './job-retry.service';
import { DeadLetterService } from './dead-letter.service';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);
  private readonly handlers = new Map<string, JobHandler>();
  private readonly jobs = new Map<string, Job>();

  constructor(
    private readonly retryService: JobRetryService,
    private readonly deadLetterService: DeadLetterService,
  ) {}

  registerHandler(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
    this.logger.log(`Job handler registered: ${name}`);
  }

  async enqueue<T>(name: string, data: T): Promise<string> {
    const job: Job = {
      id: uuidv4(),
      name,
      data,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(job.id, job);
    this.processJob(job).catch((err) =>
      this.logger.error({ err, jobId: job.id }, 'Job processing failed'),
    );
    return job.id;
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      this.logger.error(`No handler registered for job: ${job.name}`);
      return;
    }

    job.status = 'processing';
    job.updatedAt = new Date();
    job.attempts++;

    try {
      await handler.execute(job.data);
      job.status = 'completed';
      job.updatedAt = new Date();
      this.logger.debug({ jobId: job.id, jobName: job.name }, 'Job completed');
    } catch (error) {
      job.error = (error as Error).message;
      job.updatedAt = new Date();

      if (this.retryService.shouldRetry(job.attempts, job.maxAttempts)) {
        job.status = 'pending';
        const backoff = this.retryService.calculateBackoff(job.attempts, {
          maxAttempts: job.maxAttempts,
          backoffMs: 1000,
          exponential: true,
        });
        this.logger.warn(
          { jobId: job.id, attempt: job.attempts, backoff },
          'Job failed, retrying',
        );
        await this.retryService.delay(backoff);
        await this.processJob(job);
      } else {
        job.status = 'dead_lettered';
        await this.deadLetterService.sendToDeadLetter({
          jobId: job.id,
          jobName: job.name,
          data: job.data,
          attempts: job.attempts,
          lastError: job.error,
        });
        this.logger.error(
          { jobId: job.id, jobName: job.name, error: job.error },
          'Job sent to dead letter after max retries',
        );
      }
    }
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }
}
