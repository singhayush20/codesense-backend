import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';

import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';
import { GithubWebhookService } from '../../service/webhook/webhook.service';

@Controller('github-webhook')
export class GithubWebhookController {
  private readonly logger = new Logger(GithubWebhookController.name);

  constructor(private readonly webhookService: GithubWebhookService) {}

  @Post('action')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Req() req: any,
  ): Promise<void> {
    if (!event || !signature || !deliveryId) {
      throw new AppException(
        ExceptionCodes.MISSING_GITHUB_HEADERS,
        'Missing GitHub headers',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!req.body || !Buffer.isBuffer(req.body)) {
      this.logger.error('Webhook body is not raw buffer');

      throw new AppException(
        ExceptionCodes.RAW_BODY_NOT_AVAILABLE,
        'Expected raw buffer body',
        HttpStatus.BAD_REQUEST,
      );
    }

    const rawBuffer: Buffer = req.body;

    await this.webhookService.handleEvent(
      event as any,
      signature,
      deliveryId,
      rawBuffer,
    );
  }
}
