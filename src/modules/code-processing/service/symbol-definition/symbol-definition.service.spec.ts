import { Test, TestingModule } from '@nestjs/testing';
import { SymbolDefinitionService } from './symbol-definition.service';

describe('SymbolDefinitionService', () => {
  let service: SymbolDefinitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SymbolDefinitionService],
    }).compile();

    service = module.get<SymbolDefinitionService>(SymbolDefinitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
