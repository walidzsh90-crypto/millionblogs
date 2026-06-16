import { PriorityQueueService } from '../../../src/rss/scheduler/priority-queue.service';

describe('PriorityQueueService', () => {
  let queue: PriorityQueueService;

  beforeAll(() => {
    queue = new PriorityQueueService();
  });

  beforeEach(() => {
    queue.clear();
  });

  it('should enqueue and dequeue items', () => {
    queue.enqueue({ feedId: 'feed-1', priority: 5, attemptCount: 0, maxAttempts: 3 });
    expect(queue.size()).toBe(1);

    const item = queue.dequeue();
    expect(item).not.toBeNull();
    expect(item!.feedId).toBe('feed-1');
    expect(queue.size()).toBe(0);
  });

  it('should order by priority descending', () => {
    queue.enqueue({ feedId: 'low', priority: 1, attemptCount: 0, maxAttempts: 3 });
    queue.enqueue({ feedId: 'high', priority: 10, attemptCount: 0, maxAttempts: 3 });
    queue.enqueue({ feedId: 'mid', priority: 5, attemptCount: 0, maxAttempts: 3 });

    expect(queue.dequeue()!.feedId).toBe('high');
    expect(queue.dequeue()!.feedId).toBe('mid');
    expect(queue.dequeue()!.feedId).toBe('low');
  });

  it('should dequeue batch', () => {
    queue.enqueue({ feedId: 'a', priority: 1, attemptCount: 0, maxAttempts: 3 });
    queue.enqueue({ feedId: 'b', priority: 2, attemptCount: 0, maxAttempts: 3 });
    queue.enqueue({ feedId: 'c', priority: 3, attemptCount: 0, maxAttempts: 3 });

    const batch = queue.dequeueBatch(2);
    expect(batch).toHaveLength(2);
    expect(queue.size()).toBe(1);
  });

  it('should remove specific feed', () => {
    queue.enqueue({ feedId: 'feed-1', priority: 5, attemptCount: 0, maxAttempts: 3 });
    expect(queue.has('feed-1')).toBe(true);

    queue.remove('feed-1');
    expect(queue.has('feed-1')).toBe(false);
    expect(queue.size()).toBe(0);
  });

  it('should return null when empty', () => {
    expect(queue.dequeue()).toBeNull();
  });
});

// Retry queue test
import { RetryQueueService } from '../../../src/rss/scheduler/retry-queue.service';
import { DeadLetterQueueService } from '../../../src/rss/scheduler/dead-letter-queue.service';

describe('RetryQueueService', () => {
  let retryQueue: RetryQueueService;
  let priorityQueue: PriorityQueueService;
  let dlq: DeadLetterQueueService;

  beforeAll(() => {
    priorityQueue = new PriorityQueueService();
    dlq = new DeadLetterQueueService();
    retryQueue = new RetryQueueService(priorityQueue);
  });

  beforeEach(() => {
    priorityQueue.clear();
    dlq.clear();
  });

  it('should add to retry queue', () => {
    const result = retryQueue.addToRetry('feed-1', 'Timeout', 1, 5);
    expect(result).toBe(true);
    expect(retryQueue.getPendingRetries()).toHaveLength(1);
  });

  it('should return false when max attempts reached', () => {
    const result = retryQueue.addToRetry('feed-1', 'Timeout', 5, 5);
    expect(result).toBe(false);
  });

  it('should process retries back to priority queue', () => {
    retryQueue.addToRetry('feed-1', 'Timeout', 1, 5);
    expect(priorityQueue.size()).toBe(0);

    const moved = retryQueue.processRetries();
    expect(priorityQueue.size()).toBe(moved);
  });

  it('should remove from retry queue', () => {
    retryQueue.addToRetry('feed-1', 'Error', 1, 5);
    expect(retryQueue.removeFromRetry('feed-1')).toBe(true);
    expect(retryQueue.getPendingRetries()).toHaveLength(0);
  });
});

describe('DeadLetterQueueService', () => {
  let dlq: DeadLetterQueueService;

  beforeAll(() => {
    dlq = new DeadLetterQueueService();
  });

  beforeEach(() => {
    dlq.clear();
  });

  it('should add items to DLQ', () => {
    dlq.add('feed-1', 'https://example.com/feed', 'Max retries', 5, 'Timeout', new Date());
    expect(dlq.size()).toBe(1);
  });

  it('should retrieve by feed ID', () => {
    dlq.add('feed-1', 'https://example.com/feed', 'Max retries', 5, 'Timeout', null);
    const item = dlq.getByFeedId('feed-1');
    expect(item).toBeDefined();
    expect(item!.feedId).toBe('feed-1');
  });

  it('should remove from DLQ', () => {
    dlq.add('feed-1', 'https://example.com/feed', 'Error', 3, 'Failed', null);
    expect(dlq.remove('feed-1')).toBe(true);
    expect(dlq.size()).toBe(0);
  });
});
