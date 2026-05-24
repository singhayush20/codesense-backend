import { Injectable } from '@nestjs/common';

import { ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContextService {
  constructor(private readonly cls: ClsService) {}

  getRequestId(): string | undefined {
    return this.cls.get('requestId');
  }
}
