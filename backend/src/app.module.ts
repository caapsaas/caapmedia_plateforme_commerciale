import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './common/auth/auth.module';
import { SubsidiariesModule } from './common/subsidiaries/subsidiaries.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SecretariatModule } from './secretariat/secretariat.module';

@Module({
  imports: [
    // La configuration se fait maintenant via un tableau d'objets.
    // ttl est maintenant en millisecondes.
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 secondes
      limit: 10,
    }]),
    ConfigModule.forRoot({ isGlobal: true }), // Charge .env globalement
    CommonModule,
    AuthModule,
    SubsidiariesModule,
    SecretariatModule, // Importer AuthModule ici pour rendre les gardes disponibles globalement
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
