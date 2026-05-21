import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestQueryController } from './pull-request-query.controller';

describe('PullRequestQueryController', () => {
  let controller: PullRequestQueryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PullRequestQueryController],
    }).compile();

    controller = module.get<PullRequestQueryController>(
      PullRequestQueryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
