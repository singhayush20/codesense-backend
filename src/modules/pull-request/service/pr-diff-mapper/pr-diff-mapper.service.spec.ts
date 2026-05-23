import { Test, TestingModule } from '@nestjs/testing';
import { PrDiffMapperService } from './pr-diff-mapper.service';

describe('PrDiffMapperService', () => {
  let service: PrDiffMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrDiffMapperService],
    }).compile();

    service = module.get<PrDiffMapperService>(PrDiffMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
