import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { AuditService } from './audit.service';
import { AuditDecorator } from './audit.decorator';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService, AuditDecorator],
  exports: [AuditService, AuditDecorator],
})
export class AuditModule {}
