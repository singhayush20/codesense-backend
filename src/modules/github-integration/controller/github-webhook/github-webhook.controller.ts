import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { GithubWebhookService } from '../../service/webhook/webhook.service';
import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as githubWebhookPayloadDtos from '../../dtos/github-api/github-webhook-payload.dtos';

@Controller('github-webhook')
export class GithubWebhookController {
  constructor(
    private readonly webhookService: GithubWebhookService,
    @InjectPinoLogger(GithubWebhookController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post('action')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Req() req: githubWebhookPayloadDtos.GithubWebhookPayload,
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
      event,
      signature,
      deliveryId,
      rawBuffer,
    );
  }
}
