import { Test, TestingModule } from '@nestjs/testing';
import { BalancesheetService } from './balancesheet.service';

describe('BalancesheetService', () => {
  let service: BalancesheetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BalancesheetService],
    }).compile();

    service = module.get<BalancesheetService>(BalancesheetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
