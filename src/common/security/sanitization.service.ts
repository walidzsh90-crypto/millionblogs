import { Injectable } from '@nestjs/common';

@Injectable()
export class SanitizationService {
  sanitizeText(input: string): string {
    return this.stripTags(this.trimAll(input));
  }

  sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.toString();
    } catch {
      return '';
    }
  }

  stripTags(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  trimAll(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  }
}
