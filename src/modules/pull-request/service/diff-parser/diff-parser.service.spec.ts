import { Test, TestingModule } from '@nestjs/testing';
import { DiffParserService } from './diff-parser.service';

describe('DiffParserService', () => {
  let service: DiffParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiffParserService],
    }).compile();

    service = module.get<DiffParserService>(DiffParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
