import { Test, TestingModule } from '@nestjs/testing';
import { PayrollRecordService } from './payrollrecord.service';

describe('PayrollRecordService', () => {
  let service: PayrollRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollRecordService],
    }).compile();

    service = module.get<PayrollRecordService>(PayrollRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
