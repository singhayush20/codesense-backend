import { Test, TestingModule } from '@nestjs/testing';
import { LanguageDetectorService } from './language-detector.service';

describe('LanguageDetectorService', () => {
  let service: LanguageDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LanguageDetectorService],
    }).compile();

    service = module.get<LanguageDetectorService>(LanguageDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
