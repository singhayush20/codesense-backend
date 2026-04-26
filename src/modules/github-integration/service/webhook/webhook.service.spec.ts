import { Test, TestingModule } from '@nestjs/testing';
import { GithubWebhookService } from './webhook.service';

describe('WebhookService', () => {
  let service: GithubWebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubWebhookService],
    }).compile();

    service = module.get<GithubWebhookService>(GithubWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
