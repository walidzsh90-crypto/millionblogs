import { Global, Module } from '@nestjs/common';
import { JobService } from './jobs.service';
import { JobRetryService } from './job-retry.service';
import { DeadLetterService } from './dead-letter.service';

@Global()
@Module({
  providers: [JobService, JobRetryService, DeadLetterService],
  exports: [JobService, JobRetryService, DeadLetterService],
})
export class JobsModule {}
