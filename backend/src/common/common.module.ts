import { Module } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UtilsModule, AuthModule],
  exports: [UtilsModule, AuthModule], // Exporte pour utilisation dans d'autres modules
})
export class CommonModule {}