import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { GithubIntegrationModule } from '../modules/github-integration/github-integration.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
