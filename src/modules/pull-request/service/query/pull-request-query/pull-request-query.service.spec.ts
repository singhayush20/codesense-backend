import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestQueryService } from './pull-request-query.service';

describe('PullRequestQueryService', () => {
  let service: PullRequestQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PullRequestQueryService],
    }).compile();

    service = module.get<PullRequestQueryService>(PullRequestQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
