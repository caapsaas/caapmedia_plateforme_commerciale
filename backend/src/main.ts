import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Crée une instance avec le logger activé
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn', 'log', 'debug', 'verbose'] });
  
  // Get config service
  const configService = app.get(ConfigService);
  
  // Dynamic CORS configuration
  const corsOrigins = configService.get('CORS_ORIGINS')?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3001',
    'https://www.caapmedia.com',
    'https://caapmedia.com'
  ];
  
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Add global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
      const errorMessages = errors.map(error => {
        const constraints = Object.values(error.constraints || {});
        return `${error.property}: ${constraints.join(', ')}`;
      });
      return new BadRequestException({
        message: errorMessages,
        error: 'Validation failed',
        statusCode: 400,
      });
    },
  }));

  app.useStaticAssets(join(__dirname, '..', '..', 'public'), {
    prefix: '/public',
  });

  app.enableShutdownHooks();

  const staticPath = join(__dirname, '..', '..', 'public');

  Logger.log(`✅ Static files served from: ${staticPath}`, 'Bootstrap');
  
  app.setGlobalPrefix('api-caapmedia');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Application running on: https://www.caapmedia.com/api-caapmedia, port:${port}`, 'Bootstrap');
}

bootstrap();
