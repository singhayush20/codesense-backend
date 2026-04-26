import * as crypto from 'crypto';

export class GithubWebhookUtil {
  /**
   * Verifies that the webhook payload matches the signature provided by GitHub.
   * @param payload - The raw request body (string) received from the webhook.
   * @param signature - The 'X-Hub-Signature-256' header value from GitHub.
   * @param secret - The personal secret token configured in GitHub's webhook settings.
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    // Initialize an HMAC instance using the SHA-256 algorithm and secret key.
    const hmac = crypto.createHmac('sha256', secret);

    // Hash the payload and format it to match GitHub's "sha256=HEX_DIGEST" format.
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    // Compare the provided signature with our calculated digest.
    // We use timingSafeEqual to prevent "timing attacks," where an attacker
    // guesses the signature by measuring how long the comparison takes.
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
}
