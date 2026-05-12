import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryFileContentSyncService } from './repository-file-content-sync.service';

describe('RepositoryFileContentSyncService', () => {
  let service: RepositoryFileContentSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositoryFileContentSyncService],
    }).compile();

    service = module.get<RepositoryFileContentSyncService>(RepositoryFileContentSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
