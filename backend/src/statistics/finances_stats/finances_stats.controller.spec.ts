import { Test, TestingModule } from '@nestjs/testing';
import { FinancesStatsController } from './finances_stats.controller';

describe('FinancesStatsController', () => {
  let controller: FinancesStatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancesStatsController],
    }).compile();

    controller = module.get<FinancesStatsController>(FinancesStatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
