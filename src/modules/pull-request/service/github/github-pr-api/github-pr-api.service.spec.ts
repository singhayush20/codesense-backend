import { Test, TestingModule } from '@nestjs/testing';
import { GithubPrApiService } from './github-pr-api.service';

describe('GithubPrApiService', () => {
  let service: GithubPrApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubPrApiService],
    }).compile();

    service = module.get<GithubPrApiService>(GithubPrApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
