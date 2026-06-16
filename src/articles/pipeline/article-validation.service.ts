import { Injectable } from '@nestjs/common';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ArticleValidationService {
  validate(data: {
    title?: string;
    canonicalUrl?: string;
    publishedAt?: Date | string | null;
    language?: string;
    categoryIds?: string[];
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (data.title.length > 255) {
      errors.push('Title exceeds maximum length of 255 characters');
    }

    if (!data.canonicalUrl || data.canonicalUrl.trim().length === 0) {
      errors.push('Canonical URL is required');
    } else {
      try {
        new URL(data.canonicalUrl);
      } catch {
        errors.push('Canonical URL is not a valid URL');
      }
    }

    if (data.publishedAt) {
      const parsed = new Date(data.publishedAt);
      if (isNaN(parsed.getTime())) {
        warnings.push('Publication date is invalid, will use current date');
      }
    }

    if (!data.language) {
      warnings.push('No language specified, defaulting to English');
    } else {
      const validLanguages = [
        'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru', 'ja', 'ko', 'zh',
        'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'fi', 'nb', 'cs', 'hu', 'ro',
        'uk', 'el', 'he', 'th', 'vi',
      ];
      if (!validLanguages.includes(data.language)) {
        warnings.push(`Unrecognized language code: ${data.language}`);
      }
    }

    if (data.categoryIds && data.categoryIds.length > 0) {
      if (data.categoryIds.some((id) => !id || id.trim().length === 0)) {
        errors.push('Category IDs must be non-empty strings');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateForPublication(data: {
    title?: string;
    canonicalUrl?: string;
    language?: string;
    excerpt?: string;
  }): ValidationResult {
    const base = this.validate(data);
    const errors = [...base.errors];
    const warnings = [...base.warnings];

    if (!data.title || data.title.trim().length < 2) {
      errors.push('Title must be at least 2 characters for publication');
    }

    if (!data.excerpt || data.excerpt.trim().length < 10) {
      warnings.push('Excerpt is very short for publication');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
