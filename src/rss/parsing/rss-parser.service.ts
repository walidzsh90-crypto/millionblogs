import { Injectable } from '@nestjs/common';
import { ParsedFeed, ParsedFeedEntry } from './feed-parser.interface';
import { createHash } from 'crypto';

@Injectable()
export class RssParserService {
  parse(xml: string): ParsedFeed {
    const channel = this.extractElement(xml, 'channel');
    if (!channel) {
      throw new Error('Missing <channel> element');
    }

    const feed: ParsedFeed = {
      title: this.extractValue(channel, 'title'),
      description: this.extractValue(channel, 'description'),
      siteUrl: this.extractValue(channel, 'link'),
      language: this.extractValue(channel, 'language'),
      icon: this.extractImageUrl(channel),
      feedType: 'rss',
      entries: [],
    };

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const itemXml = itemMatch[1];
      const entry = this.parseEntry(itemXml);
      if (entry) feed.entries.push(entry);
    }

    return feed;
  }

  private parseEntry(itemXml: string): ParsedFeedEntry | null {
    const link = this.extractValue(itemXml, 'link');
    const guid = this.extractValue(itemXml, 'guid') || link;
    if (!guid) return null;

    const canonicalUrl = link || guid;
    const normalizedUrl = this.normalizeUrl(canonicalUrl);

    return {
      guid,
      canonicalUrl,
      normalizedUrl,
      urlHash: this.hashUrl(normalizedUrl),
      title: this.extractValue(itemXml, 'title') || 'Untitled',
      excerpt: this.stripHtml(this.extractValue(itemXml, 'description')),
      imageUrl: this.extractEnclosureImage(itemXml),
      author: this.extractValue(itemXml, 'author') || this.extractValue(itemXml, 'dc:creator'),
      categories: this.extractCategories(itemXml),
      language: null,
      publishedAt: this.parseDate(
        this.extractValue(itemXml, 'pubDate') || this.extractValue(itemXml, 'dc:date'),
      ),
    };
  }

  private extractElement(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>([\\s\\S]*)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  }

  private extractValue(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractImageUrl(channelXml: string): string | null {
    const imageMatch = channelXml.match(/<image>[\s\S]*?<url>([^<]*)<\/url>[\s\S]*?<\/image>/i);
    return imageMatch ? imageMatch[1].trim() : null;
  }

  private extractEnclosureImage(itemXml: string): string | null {
    const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
    if (enclosureMatch) {
      const url = enclosureMatch[1];
      if (/\.(jpg|jpeg|png|gif|webp|svg|avif)/i.test(url)) return url;
    }
    const mediaMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
    if (mediaMatch) {
      return mediaMatch[1];
    }
    const thumbnailMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
    return thumbnailMatch ? thumbnailMatch[1] : null;
  }

  private extractCategories(itemXml: string): string[] {
    const cats: string[] = [];
    const catRegex = /<category[^>]*>([^<]*)<\/category>/gi;
    let match: RegExpExecArray | null;
    while ((match = catRegex.exec(itemXml)) !== null) {
      cats.push(match[1].trim());
    }
    return cats;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.hash = '';
      parsed.search = '';
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
      return parsed.href.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private hashUrl(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  private parseDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private stripHtml(html: string | null): string | null {
    if (!html) return null;
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }
}
