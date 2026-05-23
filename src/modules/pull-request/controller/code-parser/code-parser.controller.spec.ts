import { Test, TestingModule } from '@nestjs/testing';
import { CodeParserController } from './code-parser.controller';

describe('CodeParserController', () => {
  let controller: CodeParserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodeParserController],
    }).compile();

    controller = module.get<CodeParserController>(CodeParserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
