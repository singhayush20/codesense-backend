import { Controller, HttpCode, HttpStatus, Post, Req, Headers } from '@nestjs/common';
import { GithubWebhookService } from '../../service/webhook/webhook.service';
import { AppException } from '../../../../exception-handling/app-exception.exception';
import { ExceptionCodes } from '../../../../exception-handling/exception-codes';


interface RawBodyRequest extends Request {
  rawBody: Buffer;
}

@Controller('github-webhook')
export class GithubWebhookController {
  constructor(private readonly webhookService: GithubWebhookService) {}

  @Post('action')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Req() req: RawBodyRequest,
  ): Promise<void> {
    if (!event || !signature || !deliveryId) {
      throw new AppException(ExceptionCodes.MISSING_GITHUB_HEADERS,'Missing GitHub headers',HttpStatus.BAD_REQUEST);
    }

    if (!req.rawBody) {
      throw new AppException(
        ExceptionCodes.RAW_BODY_NOT_AVAILABLE,
        'Raw body not available',
        HttpStatus.BAD_REQUEST,
      );
    }

    const rawPayload = req.rawBody.toString('utf8');

    await this.webhookService.handleEvent(
      event,
      signature,
      deliveryId,
      rawPayload,
    );
  }
}
