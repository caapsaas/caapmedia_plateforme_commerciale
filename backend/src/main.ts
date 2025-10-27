import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Crée une instance avec le logger activé
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
  app.enableCors({
    origin: ['http://localhost:5173', 'https://www.caapmedia.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

 
  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    prefix: '/public',
  });

  app.enableShutdownHooks();
  
  // Ajoute ce préfixe global
  // Il est important de le définir APRÈS useStaticAssets pour éviter les conflits.
  app.setGlobalPrefix('api-caapmedia');

  // Démarre l'application
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Log custom pour confirmer le démarrage
  Logger.log(`Application running on: https://www.caapmedia.com/api-caapmedia, port:${port}`, 'Bootstrap');
}

bootstrap();
