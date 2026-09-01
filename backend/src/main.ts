import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN');
  const port = Number(configService.get<string | number>('PORT')) || 8080;

  // Configure CORS from environment variable (supports comma-separated list or single origin)
  const corsOrigin = corsOriginEnv
    ? corsOriginEnv.includes(',')
      ? corsOriginEnv.split(',').map((origin) => origin.trim())
      : corsOriginEnv
    : true;

  // Global API Prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS - Allow requests from frontend on any port in dev
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`🚀 Backend is running on port ${port} with prefix /${apiPrefix}`);
}
bootstrap();
