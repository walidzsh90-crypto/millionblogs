import { Injectable } from '@nestjs/common';

@Injectable()
export class HreflangService {
  private readonly baseUrl = 'https://millionblogs.com';

  generateForArticle(
    blogSlug: string,
    articleSlug: string,
    languages: string[],
  ): Array<{ rel: string; hreflang: string; href: string }> {
    const tags: Array<{ rel: string; hreflang: string; href: string }> = [];

    for (const lang of languages) {
      tags.push({
        rel: 'alternate',
        hreflang: lang,
        href: `${this.baseUrl}/language/${lang}/article/${blogSlug}/${articleSlug}`,
      });
    }

    tags.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${this.baseUrl}/article/${blogSlug}/${articleSlug}`,
    });

    return tags;
  }

  generateForBlog(
    blogSlug: string,
    blogLanguages: string[],
  ): Array<{ rel: string; hreflang: string; href: string }> {
    const tags: Array<{ rel: string; hreflang: string; href: string }> = [];

    for (const lang of blogLanguages) {
      tags.push({
        rel: 'alternate',
        hreflang: lang,
        href: `${this.baseUrl}/language/${lang}/blog/${blogSlug}`,
      });
    }

    tags.push({
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${this.baseUrl}/blog/${blogSlug}`,
    });

    return tags;
  }
}
