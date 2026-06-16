import { Injectable } from '@nestjs/common';

@Injectable()
export class CanonicalService {
  private readonly baseUrl = 'https://millionblogs.com';

  generateArticleUrl(blogSlug: string, articleSlug: string): string {
    return `${this.baseUrl}/article/${blogSlug}/${articleSlug}`;
  }

  generateBlogUrl(blogSlug: string): string {
    return `${this.baseUrl}/blog/${blogSlug}`;
  }

  generateCategoryUrl(categorySlug: string): string {
    return `${this.baseUrl}/category/${categorySlug}`;
  }

  generateLanguageUrl(language: string): string {
    return `${this.baseUrl}/language/${language}`;
  }

  generateHomeUrl(): string {
    return this.baseUrl;
  }
}
