import { Global, Module } from '@nestjs/common';
import { RequestContextService } from './service/request-context/request-context.service';

@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class RequestContextModule {}
