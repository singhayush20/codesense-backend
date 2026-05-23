import { Test, TestingModule } from '@nestjs/testing';
import { PrCodeParsingService } from './pr-code-parsing.service';

describe('PrCodeParsingService', () => {
  let service: PrCodeParsingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrCodeParsingService],
    }).compile();

    service = module.get<PrCodeParsingService>(PrCodeParsingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
