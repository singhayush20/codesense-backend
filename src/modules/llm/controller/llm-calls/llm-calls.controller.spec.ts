import { Test, TestingModule } from '@nestjs/testing';
import { LlmCallsController } from './llm-calls.controller';

describe('LlmCallsController', () => {
  let controller: LlmCallsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmCallsController],
    }).compile();

    controller = module.get<LlmCallsController>(LlmCallsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
