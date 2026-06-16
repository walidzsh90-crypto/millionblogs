import { Injectable } from '@nestjs/common';
import { ParsedFeed, ParsedFeedEntry } from './feed-parser.interface';
import { createHash } from 'crypto';

@Injectable()
export class AtomParserService {
  parse(xml: string): ParsedFeed {
    const feed: ParsedFeed = {
      title: this.extractValue(xml, 'title'),
      description: this.extractValue(xml, 'subtitle'),
      siteUrl: this.extractAtomLink(xml),
      language: this.extractLanguage(xml),
      icon: this.extractValue(xml, 'icon') || this.extractValue(xml, 'logo'),
      feedType: 'atom',
      entries: [],
    };

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    let entryMatch: RegExpExecArray | null;
    while ((entryMatch = entryRegex.exec(xml)) !== null) {
      const entryXml = entryMatch[1];
      const entry = this.parseEntry(entryXml);
      if (entry) feed.entries.push(entry);
    }

    return feed;
  }

  private parseEntry(entryXml: string): ParsedFeedEntry | null {
    const id = this.extractValue(entryXml, 'id');
    const link = this.extractAtomLink(entryXml);
    const title = this.extractValue(entryXml, 'title');

    if (!id && !link) return null;

    const guid = id || link || '';
    const canonicalUrl = link || id || '';
    const normalizedUrl = this.normalizeUrl(canonicalUrl);

    return {
      guid,
      canonicalUrl,
      normalizedUrl,
      urlHash: this.hashUrl(normalizedUrl),
      title: title || 'Untitled',
      excerpt: this.stripHtml(this.extractValue(entryXml, 'summary') || this.extractValue(entryXml, 'content')),
      imageUrl: this.extractImageUrl(entryXml),
      author: this.extractAuthor(entryXml),
      categories: this.extractCategories(entryXml),
      language: null,
      publishedAt: this.parseDate(
        this.extractValue(entryXml, 'published') || this.extractValue(entryXml, 'updated'),
      ),
    };
  }

  private extractValue(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([^<]*)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractAtomLink(xml: string): string | null {
    const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(xml)) !== null) {
      const relMatch = match[0].match(/rel=["']([^"']+)["']/i);
      const rel = relMatch ? relMatch[1].toLowerCase() : 'alternate';
      if (rel === 'alternate' || rel === 'self') {
        return match[1];
      }
    }
    // Fallback: return first link
    const firstLink = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
    return firstLink ? firstLink[1] : null;
  }

  private extractImageUrl(entryXml: string): string | null {
    const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(entryXml)) !== null) {
      const relMatch = match[0].match(/rel=["']([^"']+)["']/i);
      const rel = relMatch ? relMatch[1].toLowerCase() : '';
      if (rel === 'enclosure' || rel === 'image') {
        const typeMatch = match[0].match(/type=["']([^"']+)["']/i);
        if (typeMatch && typeMatch[1].startsWith('image/')) return match[1];
      }
    }
    const mediaMatch = entryXml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*\/?>/i);
    return mediaMatch ? mediaMatch[1] : null;
  }

  private extractAuthor(entryXml: string): string | null {
    const authorMatch = entryXml.match(/<author>[\s\S]*?<name>([^<]*)<\/name>[\s\S]*?<\/author>/i);
    return authorMatch ? authorMatch[1].trim() : null;
  }

  private extractCategories(entryXml: string): string[] {
    const cats: string[] = [];
    const catRegex = /<category[^>]*term=["']([^"']+)["'][^>]*\/?>/gi;
    let match: RegExpExecArray | null;
    while ((match = catRegex.exec(entryXml)) !== null) {
      cats.push(match[1].trim());
    }
    return cats;
  }

  private extractLanguage(xml: string): string | null {
    const langMatch = xml.match(/xml:lang=["']([^"']+)["']/i);
    return langMatch ? langMatch[1].trim() : null;
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
