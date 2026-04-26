import * as crypto from 'crypto';

export class GithubWebhookUtil {
  static verifySignature(
    payload: Buffer,
    signature: string,
    secret: string,
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);

    const digest = Buffer.from('sha256=' + hmac.update(payload).digest('hex'));

    const sigBuffer = Buffer.from(signature);

    // Prevent timingSafeEqual crash
    if (sigBuffer.length !== digest.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, digest);
  }
}
