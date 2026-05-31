import { Test, TestingModule } from '@nestjs/testing';
import { PrToolsUtilityService } from './pr-tools-utility.service';

describe('PrToolsUtilityService', () => {
  let service: PrToolsUtilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrToolsUtilityService],
    }).compile();

    service = module.get<PrToolsUtilityService>(PrToolsUtilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
