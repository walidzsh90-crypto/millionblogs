import { Injectable, Logger } from '@nestjs/common';
import { RssValidator } from './rss-validator.service';
import { AtomValidator } from './atom-validator.service';
import { FeedValidationResult } from './feed-validator.interface';

@Injectable()
export class FeedValidatorService {
  private readonly logger = new Logger(FeedValidatorService.name);

  constructor(
    private readonly rssValidator: RssValidator,
    private readonly atomValidator: AtomValidator,
  ) {}

  async validate(url: string): Promise<FeedValidationResult> {
    this.logger.log(`Validating feed: ${url}`);

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

    let xml: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'MillionBlogs-RSS/1.0' },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        result.errors.push(`HTTP ${response.status}: ${response.statusText}`);
        return result;
      }

      xml = await response.text();
    } catch (err) {
      result.errors.push(`Unreachable: ${(err as Error).message}`);
      return result;
    }

    if (!xml || xml.trim().length === 0) {
      result.errors.push('Empty response body');
      return result;
    }

    // Try RSS first, then Atom
    let validationResult = await this.rssValidator.validate(xml);
    if (!validationResult.valid) {
      const atomResult = await this.atomValidator.validate(xml);
      if (atomResult.valid) {
        validationResult = atomResult;
      } else {
        result.errors.push(...validationResult.errors);
        result.errors.push(...atomResult.errors);
        result.warnings.push(...validationResult.warnings);
        result.warnings.push(...atomResult.warnings);
        return result;
      }
    }

    return validationResult;
  }
}
