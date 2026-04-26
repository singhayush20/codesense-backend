import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from './exception-handling/global-exception-filter';
import { AppException } from './exception-handling/app-exception.exception';
import { ExceptionCodes } from './exception-handling/exception-codes';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as express from 'express';

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

  app.setGlobalPrefix('api')

  app.use(
    '/api/v1/github-webhook',
    express.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
