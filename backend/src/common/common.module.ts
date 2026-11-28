import { Module } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module';
import { AuthModule } from './auth/auth.module';
import { SubsidiariesModule } from './subsidiaries/subsidiaries.module';
import { SystemAuditModule } from './audit/audit.module';
import { GlobalSearchModule } from './search/global-search.module';

@Module({
  imports: [
    UtilsModule,
    AuthModule,
    SubsidiariesModule,
    SystemAuditModule,
    GlobalSearchModule,
  ],
  exports: [UtilsModule, AuthModule, SystemAuditModule], // Exporte pour utilisation dans d'autres modules
})
export class CommonModule {}
