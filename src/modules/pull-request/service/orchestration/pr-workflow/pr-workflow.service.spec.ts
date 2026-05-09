import { Test, TestingModule } from '@nestjs/testing';
import { PrWorkflowService } from './pr-workflow.service';

describe('PrWorkflowService', () => {
  let service: PrWorkflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrWorkflowService],
    }).compile();

    service = module.get<PrWorkflowService>(PrWorkflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
