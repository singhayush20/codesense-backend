import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestFileSyncService } from './pull-request-file-sync.service';

describe('PullRequestFileSyncService', () => {
  let service: PullRequestFileSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PullRequestFileSyncService],
    }).compile();

    service = module.get<PullRequestFileSyncService>(
      PullRequestFileSyncService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
