import { FeedHealthService } from '../../../src/rss/health/feed-health.service';

describe('FeedHealthService', () => {
  let service: FeedHealthService;

  beforeAll(() => {
    service = new FeedHealthService();
  });

  it('should return 100 for perfect health', () => {
    const score = service.calculateHealth({
      successCount: 100,
      failureCount: 0,
      averageResponseTime: 500,
      errorCount: 0,
    });
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('should decrease score with failures', () => {
    const score = service.calculateHealth({
      successCount: 5,
      failureCount: 10,
      averageResponseTime: 500,
      errorCount: 3,
    });
    expect(score).toBeLessThan(80);
  });

  it('should decrease score with slow response times', () => {
    const score = service.calculateHealth({
      successCount: 50,
      failureCount: 0,
      averageResponseTime: 12000,
      errorCount: 0,
    });
    expect(score).toBeLessThan(85);
  });

  it('should not go below 0', () => {
    const score = service.calculateHealth({
      successCount: 0,
      failureCount: 100,
      averageResponseTime: 30000,
      errorCount: 50,
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should label scores correctly', () => {
    expect(service.getHealthLabel(95)).toBe('excellent');
    expect(service.getHealthLabel(80)).toBe('good');
    expect(service.getHealthLabel(60)).toBe('fair');
    expect(service.getHealthLabel(30)).toBe('poor');
    expect(service.getHealthLabel(10)).toBe('critical');
  });

  it('should handle zero operations', () => {
    const score = service.calculateHealth({
      successCount: 0,
      failureCount: 0,
      averageResponseTime: null,
      errorCount: 0,
    });
    expect(score).toBe(100);
  });
});
