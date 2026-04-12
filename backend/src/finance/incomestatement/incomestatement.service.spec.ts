import { Test, TestingModule } from '@nestjs/testing';
import { IncomestatementService } from './incomestatement.service';

describe('IncomestatementService', () => {
  let service: IncomestatementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncomestatementService],
    }).compile();

    service = module.get<IncomestatementService>(IncomestatementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
