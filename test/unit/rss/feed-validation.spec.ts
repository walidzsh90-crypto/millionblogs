import { RssValidator } from '../../../src/rss/validation/rss-validator.service';
import { AtomValidator } from '../../../src/rss/validation/atom-validator.service';

describe('RssValidator', () => {
  let validator: RssValidator;

  beforeAll(() => {
    validator = new RssValidator();
  });

  it('should validate a valid RSS feed', async () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <description>A test feed</description>
    <link>https://example.com</link>
    <language>en</language>
    <item>
      <title>Post 1</title>
      <link>https://example.com/post1</link>
      <description>Post 1 desc</description>
      <guid>post1</guid>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Post 2</title>
      <link>https://example.com/post2</link>
      <description>Post 2 desc</description>
      <guid>post2</guid>
      <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Post 3</title>
      <link>https://example.com/post3</link>
      <description>Post 3 desc</description>
      <guid>post3</guid>
      <pubDate>Wed, 03 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

    const result = await validator.validate(xml, 'https://example.com/feed.xml');
    expect(result.valid).toBe(true);
    expect(result.feedType).toBe('rss');
    expect(result.title).toBe('Test Feed');
    expect(result.entries).toBe(3);
  });

  it('should reject empty XML', async () => {
    const result = await validator.validate('', 'https://example.com/feed.xml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Empty XML content');
  });

  it('should reject missing RSS root', async () => {
    const result = await validator.validate('<html><body></body></html>', 'https://example.com/feed.xml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid <rss> root element');
  });

  it('should warn on no items', async () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
    <description>No items</description>
    <link>https://example.com</link>
  </channel>
</rss>`;

    const result = await validator.validate(xml, 'https://example.com/feed.xml');
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.entries).toBe(0);
  });
});

describe('AtomValidator', () => {
  let validator: AtomValidator;

  beforeAll(() => {
    validator = new AtomValidator();
  });

  it('should validate a valid Atom feed', async () => {
    const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Atom Feed</title>
  <subtitle>An atom test feed</subtitle>
  <link href="https://example.com"/>
  <entry>
    <title>Entry 1</title>
    <id>urn:uuid:1</id>
    <link href="https://example.com/entry1"/>
    <summary>Entry 1 summary</summary>
    <published>2024-01-01T00:00:00Z</published>
  </entry>
  <entry>
    <title>Entry 2</title>
    <id>urn:uuid:2</id>
    <link href="https://example.com/entry2"/>
    <summary>Entry 2 summary</summary>
    <published>2024-01-02T00:00:00Z</published>
  </entry>
  <entry>
    <title>Entry 3</title>
    <id>urn:uuid:3</id>
    <link href="https://example.com/entry3"/>
    <summary>Entry 3 summary</summary>
    <published>2024-01-03T00:00:00Z</published>
  </entry>
</feed>`;

    const result = await validator.validate(xml, 'https://example.com/atom.xml');
    expect(result.valid).toBe(true);
    expect(result.feedType).toBe('atom');
    expect(result.title).toBe('Test Atom Feed');
    expect(result.entries).toBe(3);
  });

  it('should reject missing Atom namespace', async () => {
    const xml = `<?xml version="1.0"?>
<feed>
  <title>Bad Atom</title>
</feed>`;

    const result = await validator.validate(xml, 'https://example.com/atom.xml');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
