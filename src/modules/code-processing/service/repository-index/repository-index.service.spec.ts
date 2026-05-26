import { Test, TestingModule } from '@nestjs/testing';
import { RepositorySymbolIndexService } from './repository-index.service';

describe('RepositorySymbolIndexService', () => {
  let service: RepositorySymbolIndexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositorySymbolIndexService],
    }).compile();

    service = module.get<RepositorySymbolIndexService>(
      RepositorySymbolIndexService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
