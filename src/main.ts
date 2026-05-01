import { HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import * as express from 'express';

import { AppModule } from './app.module';
import { AppException } from './exception-handling/app-exception.exception';
import { ExceptionCodes } from './exception-handling/exception-codes';
import { GlobalExceptionFilter } from './exception-handling/global-exception-filter';

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
      exceptionFactory: (errors) => {
        const message = errors
          .map((err) => Object.values(err.constraints || {}).join(', '))
          .join('; ');

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
bootstrap();
