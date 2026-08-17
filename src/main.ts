import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN || '*';

  const corsAllowedHeaders = (
    process.env.CORS_ALLOWED_HEADERS ||
    'Content-Type,Authorization,X-Tenant-Slug,Accept'
  )
    .split(',')
    .map((header) => header.trim());

  app.enableCors({
    origin:
      corsOrigin === '*'
        ? '*'
        : corsOrigin.split(',').map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: corsAllowedHeaders,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

bootstrap();