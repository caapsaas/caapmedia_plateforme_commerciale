import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Crée une instance avec le logger activé
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
  app.setGlobalPrefix('api-caapmedia');
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/api-caapmedia',
  });

  app.enableShutdownHooks();
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Log custom pour confirmer le démarrage
  Logger.log(`Application running on: https://www.caapmedia.com/api-caapmedia, port:${port}`, 'Bootstrap');
}

bootstrap();
