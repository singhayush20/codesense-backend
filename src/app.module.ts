import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { configValidationSchema } from './config/config-validation-schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { CacheModule } from './cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { GithubIntegrationModule } from './modules/github-integration/github-integration.module';
import { QueueModule } from './queue/queue.module';
import { LlmModule } from './modules/llm/llm.module';
import { PullRequestModule } from './modules/pull-request/pull-request.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './modules/ai/ai.module';
import { RequestContextService } from './modules/request-context/service/request-context/request-context.service';
import { randomUUID } from 'crypto';
import { RequestContextModule } from './modules/request-context/request-context.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      load: [configuration],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: false, // ALWAYS false (we use migrations)
        logging: ['error', 'warn'],
        retryAttempts: 1,
        retryDelay: 0,
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: Request) => {
          const rawHeader = req.headers['x-request-id'] as
            | string
            | string[]
            | undefined;

          let requestId: string | undefined;

          if (typeof rawHeader === 'string') {
            requestId = rawHeader;
          } else if (
            Array.isArray(rawHeader) &&
            typeof rawHeader[0] === 'string'
          ) {
            requestId = rawHeader[0];
          }

          cls.set('requestId', requestId ?? randomUUID());
        },
      },
    }),
    UserModule,
    CacheModule,
    AuthModule,
    GithubIntegrationModule,
    QueueModule,
    LlmModule,
    PullRequestModule,
    AiModule,
    RequestContextModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestContextService],
})
export class AppModule {}
