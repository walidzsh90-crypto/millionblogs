import { Injectable } from '@nestjs/common';
import { RssParserService } from './rss-parser.service';
import { AtomParserService } from './atom-parser.service';
import { ParsedFeed } from './feed-parser.interface';

@Injectable()
export class FeedParserFactory {
  constructor(
    private readonly rssParser: RssParserService,
    private readonly atomParser: AtomParserService,
  ) {}

  parse(xml: string, feedType: 'rss' | 'atom'): ParsedFeed {
    switch (feedType) {
      case 'rss':
        return this.rssParser.parse(xml);
      case 'atom':
        return this.atomParser.parse(xml);
      default:
        throw new Error(`Unsupported feed type: ${feedType}`);
    }
  }

  detectFeedType(xml: string): 'rss' | 'atom' {
    if (/<rss\s[^>]*version=/i.test(xml)) return 'rss';
    if (/<feed\s[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(xml)) return 'atom';
    throw new Error('Unable to detect feed type');
  }
}
