import { RssParserService } from '../../../src/rss/parsing/rss-parser.service';
import { AtomParserService } from '../../../src/rss/parsing/atom-parser.service';
import { FeedParserFactory } from '../../../src/rss/parsing/feed-parser.factory';

describe('RssParserService', () => {
  let parser: RssParserService;

  beforeAll(() => {
    parser = new RssParserService();
  });

  const sampleRss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Blog</title>
    <description>A test blog feed</description>
    <link>https://testblog.com</link>
    <language>en</language>
    <item>
      <title>First Post</title>
      <link>https://testblog.com/first</link>
      <guid>first-guid</guid>
      <description>First post excerpt</description>
      <author>John Doe</author>
      <category>Tech</category>
      <category>News</category>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://testblog.com/second</link>
      <guid>second-guid</guid>
      <description>Second post excerpt</description>
      <author>Jane Doe</author>
      <category>Science</category>
      <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

  it('should parse RSS feed metadata', () => {
    const result = parser.parse(sampleRss);
    expect(result.title).toBe('Test Blog');
    expect(result.description).toBe('A test blog feed');
    expect(result.siteUrl).toBe('https://testblog.com');
    expect(result.language).toBe('en');
    expect(result.feedType).toBe('rss');
  });

  it('should parse RSS entries', () => {
    const result = parser.parse(sampleRss);
    expect(result.entries).toHaveLength(2);
  });

  it('should parse entry fields correctly', () => {
    const result = parser.parse(sampleRss);
    const first = result.entries[0];
    expect(first.title).toBe('First Post');
    expect(first.canonicalUrl).toBe('https://testblog.com/first');
    expect(first.guid).toBe('first-guid');
    expect(first.author).toBe('John Doe');
    expect(first.excerpt).toBe('First post excerpt');
    expect(first.categories).toContain('Tech');
    expect(first.categories).toContain('News');
  });

  it('should not include full article body', () => {
    const xmlWithContent = sampleRss.replace(
      '<description>First post excerpt</description>',
      '<description>First post excerpt with <a href="link">more</a> content</description>',
    );
    const result = parser.parse(xmlWithContent);
    const first = result.entries[0];
    expect(first.excerpt).toBeDefined();
    expect(first.excerpt!.length).toBeLessThan(500);
    expect(first.excerpt).not.toContain('<a');
  });

  it('should hash URLs', () => {
    const result = parser.parse(sampleRss);
    expect(result.entries[0].urlHash).toBeDefined();
    expect(result.entries[0].urlHash.length).toBe(64);
  });

  it('should fallback guid to link', () => {
    const xmlNoGuid = sampleRss.replace('<guid>first-guid</guid>', '');
    const result = parser.parse(xmlNoGuid);
    expect(result.entries[0].guid).toBe('https://testblog.com/first');
  });

  it('should skip items without guid or link', () => {
    const xmlEmpty = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <link>https://test.com</link>
    <item><title>No Link</title><description>No link or guid</description></item>
  </channel>
</rss>`;
    const result = parser.parse(xmlEmpty);
    expect(result.entries).toHaveLength(0);
  });
});

describe('AtomParserService', () => {
  let parser: AtomParserService;

  beforeAll(() => {
    parser = new AtomParserService();
  });

  const sampleAtom = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Blog</title>
  <subtitle>An atom blog</subtitle>
  <link href="https://atomblog.com" rel="alternate"/>
  <icon>https://atomblog.com/icon.png</icon>
  <entry>
    <title>Atom Post 1</title>
    <id>urn:uuid:abc-123</id>
    <link href="https://atomblog.com/post1" rel="alternate"/>
    <summary>Atom post 1 excerpt</summary>
    <author><name>Alice</name></author>
    <category term="Tech"/>
    <published>2024-01-01T00:00:00Z</published>
  </entry>
  <entry>
    <title>Atom Post 2</title>
    <id>urn:uuid:def-456</id>
    <link href="https://atomblog.com/post2" rel="alternate"/>
    <summary>Atom post 2 excerpt</summary>
    <published>2024-01-02T00:00:00Z</published>
  </entry>
</feed>`;

  it('should parse Atom feed metadata', () => {
    const result = parser.parse(sampleAtom);
    expect(result.title).toBe('Atom Blog');
    expect(result.description).toBe('An atom blog');
    expect(result.siteUrl).toBe('https://atomblog.com');
    expect(result.icon).toBe('https://atomblog.com/icon.png');
    expect(result.feedType).toBe('atom');
  });

  it('should parse Atom entries', () => {
    const result = parser.parse(sampleAtom);
    expect(result.entries).toHaveLength(2);
  });

  it('should parse Atom entry fields', () => {
    const result = parser.parse(sampleAtom);
    const first = result.entries[0];
    expect(first.title).toBe('Atom Post 1');
    expect(first.guid).toBe('urn:uuid:abc-123');
    expect(first.canonicalUrl).toBe('https://atomblog.com/post1');
    expect(first.author).toBe('Alice');
    expect(first.categories).toContain('Tech');
  });
});

describe('FeedParserFactory', () => {
  let factory: FeedParserFactory;

  beforeAll(() => {
    const rssParser = new RssParserService();
    const atomParser = new AtomParserService();
    factory = new FeedParserFactory(rssParser, atomParser);
  });

  it('should detect RSS feed type', () => {
    const type = factory.detectFeedType('<rss version="2.0"><channel></channel></rss>');
    expect(type).toBe('rss');
  });

  it('should detect Atom feed type', () => {
    const type = factory.detectFeedType('<feed xmlns="http://www.w3.org/2005/Atom"></feed>');
    expect(type).toBe('atom');
  });

  it('should throw on unknown feed type', () => {
    expect(() => factory.detectFeedType('<html></html>')).toThrow();
  });
});
