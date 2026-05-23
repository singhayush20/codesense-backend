import { Test, TestingModule } from '@nestjs/testing';
import { ParserRuntimeService } from './runtime-parser.service';

describe('RuntimeParserService', () => {
  let service: ParserRuntimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParserRuntimeService],
    }).compile();

    service = module.get<ParserRuntimeService>(ParserRuntimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
