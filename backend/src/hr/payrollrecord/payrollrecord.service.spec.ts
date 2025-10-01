import { Test, TestingModule } from '@nestjs/testing';
import { PayrollrecordService } from './payrollrecord.service';

describe('PayrollrecordService', () => {
  let service: PayrollrecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollrecordService],
    }).compile();

    service = module.get<PayrollrecordService>(PayrollrecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
