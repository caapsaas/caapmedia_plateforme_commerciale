import { Global, Module } from '@nestjs/common';
import { SystemAuditService } from './system-audit.service';
import { AuditController } from './audit.controller';
import { UtilsModule } from '../utils/utils.module';

@Global()
@Module({
  imports: [UtilsModule],
  controllers: [AuditController],
  providers: [SystemAuditService],
  exports: [SystemAuditService],
})
export class SystemAuditModule {}
