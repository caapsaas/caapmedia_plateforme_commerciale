import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './common/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Charge .env globalement
    CommonModule,
    AuthModule, // Importer AuthModule ici pour rendre les gardes disponibles globalement
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
