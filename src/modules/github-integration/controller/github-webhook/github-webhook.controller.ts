import { Controller, HttpCode, HttpStatus, Post, Req, Headers } from '@nestjs/common';
import { GithubWebhookService } from '../../service/webhook/webhook.service';

@Controller('github-webhook')
export class GithubWebhookController {
  constructor(private readonly webhookService: GithubWebhookService) {}

  @Post('action')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
    @Req() req: any,
  ): Promise<void> {
    const rawBody = req.rawBody;

    await this.webhookService.handleEvent(
      event,
      signature,
      deliveryId,
      rawBody,
    );
  }
}
