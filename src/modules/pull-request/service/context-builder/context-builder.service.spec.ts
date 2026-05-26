import { Test, TestingModule } from '@nestjs/testing';
import { PrContextBuilderService } from './context-builder.service';

describe('ContextBuilderService', () => {
  let service: PrContextBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrContextBuilderService],
    }).compile();

    service = module.get<PrContextBuilderService>(PrContextBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
