import { DuplicateDetectionService } from '../../../src/rss/detection/duplicate-detection.service';

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionService;

  const mockPrisma = {
    rssFeedEntry: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  beforeAll(() => {
    service = new DuplicateDetectionService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect duplicate by GUID', async () => {
    mockPrisma.rssFeedEntry.findFirst.mockResolvedValueOnce({ id: 'existing-1' });

    const result = await service.check(mockPrisma, 'feed-1', {
      feedId: 'feed-1',
      guid: 'dup-guid',
      canonicalUrl: 'https://example.com/post',
      normalizedUrl: 'https://example.com/post',
      title: 'Dup Post',
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.matchField).toBe('guid');
    expect(result.existingEntryId).toBe('existing-1');
  });

  it('should detect no duplicate for new entry', async () => {
    mockPrisma.rssFeedEntry.findFirst.mockResolvedValue(null);

    const result = await service.check(mockPrisma, 'feed-1', {
      feedId: 'feed-1',
      guid: 'new-guid',
      canonicalUrl: 'https://example.com/new-post',
      normalizedUrl: 'https://example.com/new-post',
      title: 'New Post',
    });

    expect(result.isDuplicate).toBe(false);
    expect(result.matchField).toBe('none');
  });

  it('should detect duplicate by URL hash', async () => {
    mockPrisma.rssFeedEntry.findFirst
      .mockResolvedValueOnce(null) // guid
      .mockResolvedValueOnce(null) // canonicalUrl
      .mockResolvedValueOnce(null) // normalizedUrl
      .mockResolvedValueOnce({ id: 'existing-2' }); // urlHash

    const result = await service.check(mockPrisma, 'feed-1', {
      feedId: 'feed-1',
      guid: 'different-guid',
      canonicalUrl: 'https://example.com/same-post',
      normalizedUrl: 'https://example.com/same-post',
      title: 'Same Post Different GUID',
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.matchField).toBe('urlHash');
  });

  it('should produce consistent URL hashes', () => {
    const hash1 = service.hashUrl('https://Example.com/Path/');
    const hash2 = service.hashUrl('https://example.com/path');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('should normalize URLs', () => {
    const normalized = service.normalizeUrl('https://Example.com/Path/?q=1#hash');
    expect(normalized).toBe('https://example.com/path?q=1');
  });
});
