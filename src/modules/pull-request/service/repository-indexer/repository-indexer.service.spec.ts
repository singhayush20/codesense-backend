import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryIndexingService } from './repository-indexer.service';

describe('RepositoryIndexerService', () => {
  let service: RepositoryIndexingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositoryIndexingService],
    }).compile();

    service = module.get<RepositoryIndexingService>(RepositoryIndexingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
