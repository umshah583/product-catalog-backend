import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN || '*';

  app.enableCors({
    origin:
      corsOrigin === '*'
        ? '*'
        : corsOrigin
            .split(',')
            .map((origin) => origin.trim()),

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    // Allows x-tenant-slug and other custom headers
    allowedHeaders: '*',

    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(
    process.env.PORT ?? 3001,
    '0.0.0.0',
  );
}

bootstrap();