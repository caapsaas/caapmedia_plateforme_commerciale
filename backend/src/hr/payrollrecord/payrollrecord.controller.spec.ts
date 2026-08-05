import { Test, TestingModule } from '@nestjs/testing';
import { PayrollRecordController } from './payrollrecord.controller';

describe('PayrollRecordController', () => {
  let controller: PayrollRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollRecordController],
    }).compile();

    controller = module.get<PayrollRecordController>(PayrollRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
