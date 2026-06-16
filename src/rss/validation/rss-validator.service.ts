import { Injectable } from '@nestjs/common';
import { FeedValidationResult } from './feed-validator.interface';

@Injectable()
export class RssValidator {
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

    const rssTag = xml.match(/<rss\s[^>]*version=["']([^"']+)["'][^>]*>/i);
    if (!rssTag) {
      result.errors.push('Missing or invalid <rss> root element');
      return result;
    }

    result.feedType = 'rss';

    if (!xml.includes('<channel>')) {
      result.errors.push('Missing <channel> element');
      return result;
    }

    const titleMatch = xml.match(/<title>([^<]*)<\/title>/i);
    result.title = titleMatch ? titleMatch[1].trim() : null;

    const descMatch = xml.match(/<description>([^<]*)<\/description>/i);
    result.description = descMatch ? descMatch[1].trim() : null;

    const linkMatch = xml.match(/<link>([^<]*)<\/link>/i);
    result.siteUrl = linkMatch ? linkMatch[1].trim() : null;

    const langMatch = xml.match(/<language>([^<]*)<\/language>/i);
    result.language = langMatch ? langMatch[1].trim() : null;

    const iconMatch = xml.match(/<(image|logo)>([\s\S]*?)<\/(image|logo)>/i);
    if (iconMatch) {
      const urlMatch = iconMatch[2].match(/<url>([^<]*)<\/url>/i);
      result.icon = urlMatch ? urlMatch[1].trim() : null;
    }

    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi);
    result.entries = itemMatches ? itemMatches.length : 0;

    if (result.entries === 0) {
      result.warnings.push('No <item> entries found in feed');
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
