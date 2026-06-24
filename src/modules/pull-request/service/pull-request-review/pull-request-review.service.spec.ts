import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestReviewService } from './pull-request-review.service';

describe('PullRequestReviewService', () => {
  let service: PullRequestReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PullRequestReviewService],
    }).compile();

    service = module.get<PullRequestReviewService>(PullRequestReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
