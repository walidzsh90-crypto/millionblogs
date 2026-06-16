import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { EventsModule } from '../events';
import { SeoController } from './seo.controller';
import { SitemapService } from './sitemap/sitemap.service';
import { RobotsService } from './robots.service';
import { CanonicalService } from './canonical.service';
import { HreflangService } from './hreflang.service';
import { MetadataService } from './metadata.service';
import { StructuredDataService } from './structured-data.service';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [SeoController],
  providers: [
    SitemapService,
    RobotsService,
    CanonicalService,
    HreflangService,
    MetadataService,
    StructuredDataService,
  ],
  exports: [
    SitemapService,
    CanonicalService,
    HreflangService,
    MetadataService,
    StructuredDataService,
  ],
})
export class SeoModule {}
