import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface DuplicateCheckInput {
  feedId: string;
  guid: string;
  canonicalUrl: string;
  normalizedUrl: string;
  title: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchField: 'guid' | 'canonical_url' | 'normalized_url' | 'url_hash' | 'none';
  existingEntryId?: string;
}

@Injectable()
export class DuplicateDetectionService {
  async check(
    prisma: any,
    feedId: string,
    entry: DuplicateCheckInput,
  ): Promise<DuplicateCheckResult> {
    const checks: Array<{ field: string; value: string; findMany: boolean }> = [
      { field: 'guid', value: entry.guid, findMany: false },
    ];

    if (entry.canonicalUrl) {
      checks.push({ field: 'canonicalUrl', value: entry.canonicalUrl, findMany: true });
    }

    if (entry.normalizedUrl) {
      checks.push({ field: 'normalizedUrl', value: entry.normalizedUrl, findMany: true });
    }

    const urlHash = this.hashUrl(entry.normalizedUrl || entry.canonicalUrl);
    checks.push({ field: 'urlHash', value: urlHash, findMany: false });

    for (const check of checks) {
      let existing;
      if (check.findMany) {
        existing = await prisma.rssFeedEntry.findFirst({
          where: { feedId, [check.field]: check.value },
        });
      } else {
        existing = await prisma.rssFeedEntry.findFirst({
          where: { feedId, [check.field]: check.value },
        });
      }

      if (existing) {
        return {
          isDuplicate: true,
          matchField: check.field as DuplicateCheckResult['matchField'],
          existingEntryId: existing.id,
        };
      }
    }

    return { isDuplicate: false, matchField: 'none' };
  }

  hashUrl(url: string): string {
    return createHash('sha256').update(url.toLowerCase()).digest('hex');
  }

  normalizeUrl(url: string): string {
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
}
