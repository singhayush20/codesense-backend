import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './cache/cache.module';
import { configValidationSchema } from './config/config-validation-schema';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { GithubIntegrationModule } from './modules/github-integration/github-integration.module';
import { UserModule } from './modules/user/user.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
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
        logging: true, // disable in prod later
        retryAttempts: 1,
        retryDelay: 0,
      }),
    }),
    UserModule,
    CacheModule,
    AuthModule,
    GithubIntegrationModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
