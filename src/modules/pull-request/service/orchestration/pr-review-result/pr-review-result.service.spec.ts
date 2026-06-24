import { Test, TestingModule } from '@nestjs/testing';
import { GithubPrReviewCommentService } from '../../github/github-pr-review-comment/github-pr-review-comment.service';
import { PullRequestReviewService } from '../../pull-request-review/pull-request-review.service';
import { PrReviewResultService } from './pr-review-result.service';

describe('PrReviewResultService', () => {
  let service: PrReviewResultService;

  const pullRequestReviewService = {
    savePullRequestReview: jest.fn(),
  };
  const githubPrReviewCommentService = {
    postReviewComments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrReviewResultService,
        {
          provide: PullRequestReviewService,
          useValue: pullRequestReviewService,
        },
        {
          provide: GithubPrReviewCommentService,
          useValue: githubPrReviewCommentService,
        },
      ],
    }).compile();

    service = module.get<PrReviewResultService>(PrReviewResultService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
