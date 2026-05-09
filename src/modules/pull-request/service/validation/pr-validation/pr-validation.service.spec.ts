import { Test, TestingModule } from '@nestjs/testing';
import { PrValidationService } from './pr-validation.service';

describe('PrValidationService', () => {
  let service: PrValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrValidationService],
    }).compile();

    service = module.get<PrValidationService>(PrValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
