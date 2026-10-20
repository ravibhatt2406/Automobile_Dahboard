import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('TitanBootstrap');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 4000;
  const corsOrigin = process.env.CORS_ORIGIN || '*';

  // Enable CORS
  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);

      const rawOrigins = process.env.CORS_ORIGIN || '*';
      const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin);

      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(requestOrigin) ||
        isLocalhost
      ) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
    },
    credentials: true,
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger OpenAPI Setup
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Titan Auto Platform API')
      .setDescription('Enterprise Automobile Franchise Management Platform Backend — Phase 1 RBAC, Auth & Multi-Tenancy')
      .setVersion('1.0.0-phase1')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`OpenAPI Swagger documentation available at http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`Titan Auto Backend Platform running on port ${port}`);
}

bootstrap();
