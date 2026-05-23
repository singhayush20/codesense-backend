import { Test, TestingModule } from '@nestjs/testing';
import { PrAstProcessingService } from './pr-ast-processing.service';

describe('PrAstProcessingService', () => {
  let service: PrAstProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrAstProcessingService],
    }).compile();

    service = module.get<PrAstProcessingService>(PrAstProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
