import { Test, TestingModule } from '@nestjs/testing';
import { PrProcessingServiceService } from './pr-processing.service';

describe('PrProcessingServiceService', () => {
  let service: PrProcessingServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrProcessingServiceService],
    }).compile();

    service = module.get<PrProcessingServiceService>(PrProcessingServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
