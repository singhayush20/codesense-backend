import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from './exception-handling/global-exception-filter';
import { AppException } from './exception-handling/app-exception.exception';
import { ExceptionCodes } from './exception-handling/exception-codes';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import './observability/telemetry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: false,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      exceptionFactory: (errors: ValidationError[]) => {
        const extractMessages = (
          validationErrors: ValidationError[],
          depth = 0,
        ): string[] => {
          const messages: string[] = [];
          const indent = '  '.repeat(depth);

          for (const err of validationErrors) {
            if (err.constraints) {
              const constraintMessages = Object.values(err.constraints);
              messages.push(
                ...constraintMessages.map((msg: string) => `${indent}${msg}`),
              );
            }
            if (err.children && Array.isArray(err.children)) {
              messages.push(
                ...extractMessages(err.children, depth + 1).map(
                  (msg: string) => `${indent}${msg}`,
                ),
              );
            }
          }
          return messages;
        };

        const messageList = extractMessages(errors);
        const message =
          messageList.length > 0 ? messageList.join('; ') : 'Validation failed';

        return new AppException(
          ExceptionCodes.METHOD_ARGUMENT_NOT_VALID,
          message,
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('CodeSense')
    .setDescription('AI Code Reviewer Platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  app.setGlobalPrefix('api');

  // do not change the order of parsers
  app.use(
    '/api/v1/github-webhook/action',
    bodyParser.raw({
      type: 'application/json',
    }),
  );

  app.use(express.json());

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap().catch((error: unknown) => {
  console.error('Application failed to start', error);
  process.exit(1);
});
