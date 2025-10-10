import { Test, TestingModule } from '@nestjs/testing';
import { FinancesStatsService } from './finances_stats.service';

describe('FinancesStatsService', () => {
  let service: FinancesStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancesStatsService],
    }).compile();

    service = module.get<FinancesStatsService>(FinancesStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
