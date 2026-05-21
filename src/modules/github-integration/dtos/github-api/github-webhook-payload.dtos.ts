import { Request } from 'express';

export interface GithubWebhookPayload extends Request {
  body: Buffer;
}
