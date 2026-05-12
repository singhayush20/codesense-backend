import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestSyncService } from './pull-request-sync.service';

describe('PullRequestSyncService', () => {
  let service: PullRequestSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PullRequestSyncService],
    }).compile();

    service = module.get<PullRequestSyncService>(PullRequestSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
