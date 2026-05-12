import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotCleanupService } from './snapshot-cleanup.service';

describe('SnapshotCleanupService', () => {
  let service: SnapshotCleanupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SnapshotCleanupService],
    }).compile();

    service = module.get<SnapshotCleanupService>(SnapshotCleanupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
