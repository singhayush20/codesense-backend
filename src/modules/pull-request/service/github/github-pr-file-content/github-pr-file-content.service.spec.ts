import { Test, TestingModule } from '@nestjs/testing';
import { GithubPrFileContentService } from './github-pr-file-content.service';

describe('GithubPrFileContentService', () => {
  let service: GithubPrFileContentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GithubPrFileContentService],
    }).compile();

    service = module.get<GithubPrFileContentService>(GithubPrFileContentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
