import { Injectable } from '@nestjs/common';
import { FeedValidationResult } from './feed-validator.interface';

@Injectable()
export class AtomValidator {
  async validate(xml: string): Promise<FeedValidationResult> {
    const result: FeedValidationResult = {
      valid: false,
      feedType: null,
      title: null,
      description: null,
      siteUrl: null,
      language: null,
      icon: null,
      entries: 0,
      errors: [],
      warnings: [],
    };

    if (!xml || xml.trim().length === 0) {
      result.errors.push('Empty XML content');
      return result;
    }

    const feedTag = xml.match(/<feed\s[^>]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["'][^>]*>/i);
    if (!feedTag) {
      result.errors.push('Missing or invalid <feed> root element with Atom namespace');
      return result;
    }

    result.feedType = 'atom';

    const titleMatch = xml.match(/<title[^>]*>([^<]*)<\/title>/i);
    result.title = titleMatch ? titleMatch[1].trim() : null;

    const subtitleMatch = xml.match(/<subtitle[^>]*>([^<]*)<\/subtitle>/i);
    result.description = subtitleMatch ? subtitleMatch[1].trim() : null;

    const linkMatch = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
    result.siteUrl = linkMatch ? linkMatch[1].trim() : null;

    const langMatch = xml.match(/xml:lang=["']([^"']+)["']/i);
    result.language = langMatch ? langMatch[1].trim() : null;

    const iconMatch = xml.match(/<icon>([^<]*)<\/icon>/i);
    result.icon = iconMatch ? iconMatch[1].trim() : null;

    const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/gi);
    result.entries = entryMatches ? entryMatches.length : 0;

    if (result.entries === 0) {
      result.warnings.push('No <entry> elements found in feed');
    }

    if (result.entries < 3) {
      result.warnings.push('Feed has fewer than 3 entries');
    }

    if (!result.title) {
      result.warnings.push('Feed has no title');
    }

    result.valid = result.errors.length === 0;
    return result;
  }
}
