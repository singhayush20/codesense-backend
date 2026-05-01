import { Test, type TestingModule } from '@nestjs/testing';

import { PrProcessingService } from './pr-processing.service';

describe('PrProcessingService', () => {
  let service: PrProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrProcessingService],
    }).compile();

    service = module.get<PrProcessingService>(PrProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
