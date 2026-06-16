import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { AuditModule } from '../audit';
import { ActivityModule } from '../activity';
import { EventsModule } from '../events';
import { BlogsService } from './blogs.service';
import { BlogsRepository } from './blogs.repository';
import { BlogsController } from './blogs.controller';
import { AdminBlogsController } from './admin-blogs.controller';
import { AdminBlogService } from './admin-blog.service';
import { VerificationModule } from '../verification';

@Module({
  imports: [PrismaModule, AuditModule, ActivityModule, EventsModule, VerificationModule],
  controllers: [BlogsController, AdminBlogsController],
  providers: [BlogsService, BlogsRepository, AdminBlogService],
  exports: [BlogsService, BlogsRepository, AdminBlogService],
})
export class BlogsModule {}
