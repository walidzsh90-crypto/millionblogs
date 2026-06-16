import { Injectable } from '@nestjs/common';

@Injectable()
export class RobotsService {
  generate(): string {
    return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /user/

Sitemap: https://millionblogs.com/sitemap.xml

# Crawl delay
Crawl-Delay: 10

# Host
Host: https://millionblogs.com
`;
  }
}
