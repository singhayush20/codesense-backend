import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestLockService } from './pull-request-lock.service';

describe('PullRequestLockService', () => {
  let service: PullRequestLockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PullRequestLockService],
    }).compile();

    service = module.get<PullRequestLockService>(PullRequestLockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
