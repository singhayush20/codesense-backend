import { Test, TestingModule } from '@nestjs/testing';
import { PrFileFilterService } from './pr-file-filter.service';

describe('PrFileFilterService', () => {
  let service: PrFileFilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrFileFilterService],
    }).compile();

    service = module.get<PrFileFilterService>(PrFileFilterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
