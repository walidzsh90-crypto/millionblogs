export interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead_lettered';
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobHandler<T = unknown> {
  execute(data: T): Promise<void>;
}

export interface JobQueue {
  enqueue<T>(name: string, data: T, options?: JobOptions): Promise<string>;
  process<T>(name: string, handler: JobHandler<T>): void;
}

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
}
