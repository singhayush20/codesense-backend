import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestFileQueryService } from './pull-request-file-query.service';

describe('PullRequestFileQueryService', () => {
  let service: PullRequestFileQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PullRequestFileQueryService],
    }).compile();

    service = module.get<PullRequestFileQueryService>(PullRequestFileQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
